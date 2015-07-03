SyncedCron.add({
    name: 'crontab',
    schedule: function(parser) {
        // parser is a later.parse object
        // return parser.text('every 5 seconds');
        // return parser.text('every 1 minutes');
        return parser.text('at 22:00');
    },
    job: function() {
        return;
    }
});

