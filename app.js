var express = require('express'),
    _ = require("underscore"),
    swig = require("swig");

module.exports = {
    "title": "Admin",
    "name": "admin",
    "routes": [],
    "app": function admin (config, db, site) {
        var app = express();
        _.extend(app.locals, site.locals);
        
        app.set('views', __dirname + "/views");
        
        app.get('/member/:uuid', function index (req, res) {
            var user = res.locals.user;
            if (user) {
                if ((user.permissions >= 50) || (user.email == config.adminemail)) {
                    // get all members
                    res.locals.User.findOne({where: {uuid: req.params.uuid}},
                        function (err, member) {
                            if (!err) {
                                member.historic_events(function (err, events) {
                                    if (!err) {
                                        res.render("member",{member: member, events: events});
                                    }
                                    else {
                                        res.locals.flash("danger", "Database Error.", "Member evens cannot be retrieved at present.");
                                        res.redirect("/admin");
                                    }
                                });
                            }
                            else {
                                res.locals.flash("danger", "Database Error.", "Member cannot be retrieved at present.");
                                res.redirect("/admin");
                            }
                        }
                    );
                }
                else {
                    res.locals.flash("danger", "Not enough permissions.", "You do not have enough permissions for admin access.");
                    res.redirect("/admin");
                }
            }
            else {
                res.locals.flash("danger", "Not logged in.", "You cannot access the admin list when not logged in.");
                res.redirect("/admin");
            }
        });
        
        app.get('/', function index (req, res) {
            var user = res.locals.user;
            if (user) {
                if ((user.permission >= 50) || (user.email == config.adminemail)) {
                    // get all members
                    res.locals.User.all(function (err, members) {
                        if (!err) {
                            res.render("members",{members: members, members_count: members.length});
                        }
                        else {
                            res.locals.flash("danger", "Could not write to database.", "There was an error with the database.");
                            res.redirect("/admin");
                        }
                    });
                }
                else {
                    res.locals.flash("danger", "Not enough permissions.", "You do not have enough permissions for admin access.");
                    res.redirect("/");
                }
            }
            else {
                res.locals.flash("danger", "Not logged in.", "You cannot access the admin list when not logged in.");
                res.redirect("/");
            }
        });
        
        app.post("/member/:uuid", function (req, res) {
            var user = res.locals.user;

            if (user) {
                if ((user.permission >= 50) || (user.email == config.adminemail)) {
                    // update member
                    res.locals.User.findOne({where: {uuid: req.params.uuid}}, function (err, member) {
                        member.name = req.body.name;
                        member.email = req.body.email;
                        member.address = req.body.address;
                        member.card_id = req.body.card_id;
                        if (req.body.to_expire) {
                            member.membership_expires = Date.parse(req.body.to_expire);
                        }
                        member.permission = parseInt(req.body.permission);
                        
                        member.isValid(function (valid) {
                            if (valid) {
                                member.save(function (err, member) {
                                    // must handle validation errors
                                    if (!err) {
                                        res.locals.flash("success", "Updated.", "Member account updated successfully.");
                                        res.render("member", {member: member});
                                    }
                                    else {
                                        console.log("Could not save entry because: " + err);
                                        console.log("Data: " + member);
                                        res.send(500, "Database error. This has been logged but please report the issue with the code SLME003.");
                                    }
                                });
                            }
                            else {
                                res.locals.flash("danger", "Update failed.", "Member information could not be saved because of errors.");
                                res.render("membership", {member: member, errors: member.errors});
                            }
                        });
                    });
                }
            }
        });
        
        return app;
    }
}

