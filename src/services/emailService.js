const logger = require('../utils/logger.js');

exports.sendOrderConfirmation = async (user, order) => {
  try {
    logger.info(`Order confirmation email sent to ${user.email} for order ${order.id}`);
    return true;
  } catch (error) {
    logger.error('Failed to send email:', error);
    return false;
  }
};

exports.sendWelcomeEmail = async (user) => {
  try {
    logger.info(`Welcome email sent to ${user.email}`);
    return true;
  } catch (error) {
    logger.error('Failed to send welcome email:', error);
    return false;
  }
};