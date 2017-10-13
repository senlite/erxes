import { NotificationConfigurations, Notifications } from '../../../db/models';

export default {
  /**
   * Save notification configuration
   * @param {Object} object
   * @param {Object} object - NotificationConfiguration object
   * @param {string} object2.notifType - Notification configuration notification type (module)
   * @param {Boolean} object2.isAllowed - Shows whether notifications will be received or not
   * @param {Object} object3 - Middleware data
   * @param {Object} object3.user - The user making this action
   * @return {Promise} returns Promise resolving a Notification document
   * @throws {Error} throws error if user is not logged in
   */
  notificationsSaveConfig(root, doc, { user }) {
    if (!user) {
      throw new Error('Login required');
    }

    return NotificationConfigurations.createOrUpdateConfiguration(doc, user);
  },

  /**
   * Marks notification as read
   * @param {Object}
   * @param {Object} object2 - Graphql input data
   * @param {string} object2.ids - Notification ids
   * @param {Object} object3 - Middleware data
   * @param {Object} object3.user - The user making this action
   * @return {Promise}
   * @throws {Error} throws error if user is not logged in
   */
  notificationsMarkAsRead(root, { ids }, { user }) {
    if (!user) {
      throw new Error('Login required');
    }

    return Notifications.markAsRead(ids);
  },
};
