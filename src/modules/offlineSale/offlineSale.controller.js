const { success, error } = require("../../utils/apiResponse");
const { prisma }         = require("../../config/db");

// Bill number generate karo
const generateBillNumber = async (storeId) => {
  const count = await prisma.offlineSale.count({ where: { storeId } });
  const date  = new Date();
  const year  = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `BILL-${year}${month}-${String(count + 1).padStart(4, "0")}`;
};

const createSale = async (req, res) => {
  try {
    const { customerName, customerPhone, customerEmail, customerGstin, items, subtotal, discountAmount, gstAmount, totalAmount, paymentMode, billImage, notes } = req.body;

    const customer = await prisma.user.findUnique({
      where: { phone: customerPhone }
    });

    const billNumber = await generateBillNumber(req.user.store.id);

    const sale = await prisma.offlineSale.create({
      data: {
        billNumber,
        storeId:        req.user.store.id,
        customerId:     customer?.id || null,
        customerName,
        customerPhone,
        customerEmail:  customerEmail  || null,
        customerGstin:  customerGstin  || null,
        items,
        subtotal:       Number(subtotal),
        discountAmount: Number(discountAmount || 0),
        gstAmount:      Number(gstAmount || 0),
        totalAmount:    Number(totalAmount),
        paymentMode:    paymentMode || "CASH",
        billImage:      billImage || null,
        notes:          notes     || null,
      }
    });

    success(res, sale, "Bill save ho gaya!");
  } catch (err) {
    error(res, err.message);
  }
};

const getStoreSales = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = { storeId: req.user.store.id };
    if (search) {
      where.OR = [
        { customerName:  { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search } },
        { billNumber:    { contains: search } },
      ];
    }

    const [sales, total] = await Promise.all([
      prisma.offlineSale.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip:    Number(skip),
        take:    Number(limit),
      }),
      prisma.offlineSale.count({ where }),
    ]);

    success(res, sales);
  } catch (err) {
    error(res, err.message);
  }
};

const getSale = async (req, res) => {
  try {
    const sale = await prisma.offlineSale.findFirst({
      where: { id: req.params.id, storeId: req.user.store.id }
    });
    if (!sale) return error(res, "Bill nahi mila", 404);
    success(res, sale);
  } catch (err) {
    error(res, err.message);
  }
};

const deleteSale = async (req, res) => {
  try {
    await prisma.offlineSale.delete({
      where: { id: req.params.id }
    });
    success(res, null, "Bill delete ho gaya!");
  } catch (err) {
    error(res, err.message);
  }
};

const getMyPurchases = async (req, res) => {
  try {
    const purchases = await prisma.offlineSale.findMany({
      where:   { customerId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: { store: { select: { storeName: true, address: true, city: true } } }
    });
    success(res, purchases);
  } catch (err) {
    error(res, err.message);
  }
};

module.exports = { createSale, getStoreSales, getSale, deleteSale, getMyPurchases };