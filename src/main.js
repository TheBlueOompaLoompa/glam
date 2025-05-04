/* main.js
 *
 * Copyright 2025 Benjamin Nack
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk?version=4.0';
import Gdk from 'gi://Gdk';
import Adw from 'gi://Adw?version=1';

import { GlamWindow } from './window.js';
import ClamAV from './clamav.js';

pkg.initGettext();
pkg.initFormat();

export const GlamApplication = GObject.registerClass(
    class GlamApplication extends Adw.Application {
        av;

        constructor() {
            super({
                application_id: 'org.bloompa.Glam',
                flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
                resource_base_path: '/org/bloompa/Glam'
            });

            const quit_action = new Gio.SimpleAction({name: 'quit'});
            quit_action.connect('activate', action => {
                this.quit();
            });

            this.add_action(quit_action);
            this.set_accels_for_action('app.quit', ['<primary>q']);

            const show_about_action = new Gio.SimpleAction({name: 'about'});
            show_about_action.connect('activate', action => {
                const aboutParams = {
                    application_name: 'Glam',
                    application_icon: 'org.bloompa.Glam',
                    developer_name: 'Benjamin Nack',
                    version: '0.1.0',
                    developers: [
                        'Benjamin Nack'
                    ],
                    // Translators: Replace "translator-credits" with your name/username, and optionally an email or URL.
                    translator_credits: _("translator-credits"),
                    copyright: '© 2025 Benjamin Nack'
                };
                const aboutDialog = new Adw.AboutDialog(aboutParams);
                aboutDialog.present(this.active_window);
            });
            this.add_action(show_about_action);

            this.av = new ClamAV();

            this.av.actions.forEach(action => {
                this.add_action(action);
            });
        }

        vfunc_startup() {
          super.vfunc_startup();
          const provider = new Gtk.CssProvider();
		      provider.load_from_resource('/org/bloompa/Glam/css/style.css');

		      // Add the provider to the StyleContext of the default display
		      Gtk.StyleContext.add_provider_for_display(
			      Gdk.Display.get_default(),
			      provider,
			      Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
		      );
        }

        vfunc_activate() {
            let {active_window} = this;

            if (!active_window)
                active_window = new GlamWindow(this);

            active_window.present();

            active_window._load_stack.set_visible_child_name('main')
            if(!this.av.dbExists) {
                active_window._load_stack.set_visible_child_name('loading');
                const dialog = Adw.AlertDialog.new("Threat Database Empty", "ClamAV's threat database has no entries. Do you want to download a fresh database from the internet?");
                dialog.set_prefer_wide_layout(false);
                dialog.set_default_response('yes');
                dialog.add_response('quit', '_Quit Glam');
                dialog.add_response('yes', '_Yes');
                dialog.set_response_appearance('quit', Adw.ResponseAppearance.DESTRUCTIVE);
                dialog.set_response_appearance('yes', Adw.ResponseAppearance.SUGGESTED);
                dialog.connect('response', (_, response) => {
                    if(response == 'quit') this.quit();
                    else try {
                      this.av.updateDb((exitStatus) => {
                        if(exitStatus != 0) { console.log(`Exited db update ${exitStatus}`); this.quit(); }
                        active_window._load_stack.set_visible_child_name('main')
                      });
                    } catch(e) { console.log(e); this.quit();}
                });
                dialog.present(active_window);
            }
        }
    }
);

export function main(argv) {
    const application = new GlamApplication();
    return application.runAsync(argv);
}
