var isMaster = process.env.TP_MASTER == 1;
if (!isMaster) {
	logger.info('Server is running as [worker]');
	return;
}
logger.info('Server is running as [master]');

SyncedCron.start();
var admin = Meteor.users.findOne({username:'topspot'});
if (admin)
	Roles.addUsersToRoles(admin, ['admin', 'editor']);
