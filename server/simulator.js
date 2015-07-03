// simulate people bets

Meteor.startup(function() {
    if (process.env.SIMULATOR != 'on') return;
    logger.info('Simulator started.');
})

