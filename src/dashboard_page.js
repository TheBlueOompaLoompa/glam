/* dashboard_page.js
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
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

export const DashPage = GObject.registerClass({
    GTypeName: 'DashPage',
    Template: 'resource:///org/bloompa/Glam/dashboard_page.ui',
    InternalChildren: ['rtproc_switch'],
}, class DashPage extends Gtk.Box {
    rtprocStateLock = false;
    av = null;

    init(av) {
        this.av = av;
        this.rtprocStateLock = false;

        this.periodic();

        this.rtproc_switch_on_state_set = this.rtproc_switch_on_state_set.bind(this);
        this._rtproc_switch.connect('state-set', this.rtproc_switch_on_state_set);
        //this._select_one_time.connect('activate', this.select_one_time_on_activate);

        this.periodicInt();

        return true;
    }

    rtproc_switch_on_state_set(_, state) {
        if(this.rtprocStateLock || this.av == null) return;
        if(state) {
            this.av.startClamd();
        }else {
            this.av.stopClamd();
        }
    }

    select_one_time_on_activate() {

    }

    periodic() {
        this.rtprocStateLock = true;
        this._rtproc_switch.set_active(this.av.checkClamdRunning());
        this.rtprocStateLock = false;
    }

    periodicInt() {
        setInterval(() => {
            this.periodic()
        }, 1000);
    }
});

