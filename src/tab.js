/* This file is part of Tryton.  The COPYRIGHT file at the top level of
   this repository contains the full copyright notices and license terms. */
(function() {
    'use strict';

    Sao.Tab = Sao.class_(Object, {
        init: function() {
            this.buttons = {};
        },
        create_toolbar: function() {
            var toolbar = jQuery('<div/>', {
                'class': 'ui-widget-header ui-corner-all'
            });
            var add_button = function(tool) {
                var click_func = function() {
                    this[tool[4]]();
                };
                var button = jQuery('<button/>').button({
                    id: tool[0],
                    text: tool[2],
                    icons: {
                        primary: tool[1]
                    },
                    label: tool[2]
                })
                .click(click_func.bind(this));
                toolbar.append(button);
                // TODO tooltip
                this.buttons[tool[0]] = button;
            };
            this.toolbar_def.forEach(add_button.bind(this));
            return toolbar;
        }
    });

    Sao.Tab.counter = 0;

    Sao.Tab.create = function(attributes) {
        if (attributes.context === undefined) {
            attributes.context = {};
        }
        var tab;
        if (attributes.model) {
            tab = new Sao.Tab.Form(attributes.model, attributes);
        } else {
            tab = new Sao.Tab.Board(attributes);
        }
        jQuery('#tabs').tabs();
        tab.id = '#tab-' + Sao.Tab.counter++;
        jQuery('#tabs').tabs('add', tab.id, tab.name);
        jQuery('#tabs > ul li').last().append(jQuery('<a href="#">' +
                    '<span class="ui-icon ui-icon-circle-close"></span>' +
                    '</a>')
                .hover(
                    function() {
                        jQuery(this).css('cursor', 'pointer');
                    },
                    function() {
                        jQuery(this).css('cursor', 'default');
                    })
                .click(function() {
                    // TODO check modified
                    jQuery('#tabs').tabs('remove', tab.id);
                }));
        jQuery(tab.id).html(tab.el);
        jQuery('#tabs').tabs('select', tab.id);
    };

    Sao.Tab.Form = Sao.class_(Sao.Tab, {
        init: function(model_name, attributes) {
            Sao.Tab.Form._super.init.call(this);
            var screen = new Sao.Screen(model_name, attributes);
            this.screen = screen;
            this.attributes = jQuery.extend({}, attributes);
            this.name = attributes.name; // XXX use screen current view title
            var el = jQuery('<div/>', {
                'class': 'form'
            });
            // TODO title
            var toolbar = this.create_toolbar();
            el.append(toolbar);
            this.el = el;
            this.view_prm = this.screen.load_next_view().done(function() {
                el.append(screen.el);
            }).done(function() {
                screen.search_filter().done(function() {
                    screen.display();
                });
            });
        },
        // TODO translate labels
        toolbar_def: [
            ['new', 'ui-icon-document', 'New', 'Create a new record', 'new_'],
            ['save', 'ui-icon-disk', 'Save', 'Save this record', 'save'],
            ['switch', 'ui-icon-arrow-4-diag', 'Switch', 'Switch view',
            'switch_'],
            ['reload', 'ui-icon-refresh', 'Reload', 'Reload', 'reload'],
            ['previous', 'ui-icon-arrowthick-1-w', 'Previous',
            'Previous Record', 'previous'],
            ['next', 'ui-icon-arrowthick-1-e', 'Next', 'Next Record', 'next'],
            ['attach', 'ui-icon-pin-s', 'Attachment',
            'Add an attachment to the record', 'attach']
            ],
        create_toolbar: function() {
            var toolbar = Sao.Tab.Form._super.create_toolbar.call(this);
            var screen = this.screen;
            var buttons = this.buttons;
            var prm = screen.model.execute('view_toolbar_get', [],
                    screen.context);
            prm.done(function(toolbars) {
                // TODO translation
                [
                ['action', 'ui-icon-gear', 'Action', 'Launch action'],
                ['relate', 'ui-icon-arrowreturn-1-e', 'Relate',
                'Open related records'],
                ['print', 'ui-icon-print', 'Print', 'Print report']
                ].forEach(function(menu_action) {
                    var button = jQuery('<button/>').button({
                        id: menu_action[0],
                        text: menu_action[2],
                        icons: {
                            primary: menu_action[1],
                            secondary: 'ui-icon-triangle-1-s'
                        },
                        label: menu_action[2]
                    });
                    buttons[menu_action[0]] = button;
                    toolbar.append(button);
                    var menu = jQuery('<ul/>').menu({}).hide().css({
                        position: 'absolute'
                    });
                    button.click(function() {
                        menu.show().position({
                            my: 'left top',
                            at: 'left bottom',
                            of: button
                        });
                        jQuery(document).one('click', function() {
                            menu.hide();
                        });
                        return false;
                    });

                    toolbars[menu_action[0]].forEach(function(action) {
                        var item = jQuery('<li/>').append(
                            jQuery('<a/>').append(action.name));
                        menu.append(item);
                        item.click(function() {
                            var exec_action = jQuery.extend({}, action);
                            // TODO test save
                            exec_action = Sao.Action.evaluate(exec_action,
                                menu_action[0], screen.current_record);
                            var data = {
                                model: screen.model_name,
                                id: screen.get_id(),
                                ids: [screen.get_id()] // TODO ids selected
                            };
                            Sao.Action.exec_action(exec_action, data,
                                screen.context);
                        });
                    });
                    toolbar.append(menu);
                });
            });
            return toolbar;
        },
        switch_: function() {
            // TODO modified
            this.screen.switch_view();
        }
    });
}());