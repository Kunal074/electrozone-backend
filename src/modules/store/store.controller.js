const storeService = require("./store.service");
const { success, paginated } = require("../../utils/apiResponse");

const storeController = {

  async getStores(req, res) {
    const result = await storeService.getStores(req.query);
    paginated(res, result.stores, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  },

  async getStoreById(req, res) {
    const store = await storeService.getStoreById(req.params.id);
    success(res, store);
  },

  async getMyStore(storeId) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
  });
  if (!store) throw { statusCode: 404, message: "Store nahi mila." };
  return store;
},

  async updateMyStore(req, res) {
    const storeId = req.user.store.id;
    const store = await storeService.updateMyStore(storeId, req.body);
    success(res, store, "Store update ho gaya!");
  },

  async getAllStores(req, res) {
    const result = await storeService.getAllStores(req.query);
    paginated(res, result.stores, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  },

  async approveStore(req, res) {
    const { isApproved } = req.body;
    const store = await storeService.approveStore(req.params.id, isApproved);
    success(res, store, `Store ${isApproved ? "approve" : "reject"} ho gaya!`);
  },

  async updateSubscription(req, res) {
    const { plan, expiryDays } = req.body;
    const store = await storeService.updateSubscription(req.params.id, plan, expiryDays);
    success(res, store, "Subscription update ho gaya!");
  },
};


module.exports = storeController;