const usedPhoneService = require("./usedPhone.service");
const { success, paginated } = require("../../utils/apiResponse");

const usedPhoneController = {

  async getUsedPhones(req, res) {
    const result = await usedPhoneService.getUsedPhones(req.query);
    paginated(res, result.usedPhones, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  },

  async getUsedPhoneById(req, res) {
    const usedPhone = await usedPhoneService.getUsedPhoneById(req.params.id);
    success(res, usedPhone);
  },

  async createUsedPhone(req, res) {
    const usedPhone = await usedPhoneService.createUsedPhone(req.body, req.user);
    success(res, usedPhone, "Used phone listing add ho gaya!", 201);
  },

  async updateUsedPhone(req, res) {
    const usedPhone = await usedPhoneService.updateUsedPhone(
      req.params.id, req.body, req.user
    );
    success(res, usedPhone, "Listing update ho gaya!");
  },

  async deleteUsedPhone(req, res) {
    const result = await usedPhoneService.deleteUsedPhone(req.params.id, req.user);
    success(res, result);
  },

  async markAsSold(req, res) {
    const result = await usedPhoneService.markAsSold(req.params.id, req.user);
    success(res, result, "Sold mark ho gaya!");
  },
};

module.exports = usedPhoneController;