/* clamav.js
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

import GLib from 'gi://GLib';
import Gio from "gi://Gio";

export default class ClamAV {
    dbExists = false;
    dbFile;
    actions = [];
    clamdRunning = false;

    checkClamdRunning() {
        const proc = this.exec(['pgrep', 'clamd', '-x'], false);
        proc.wait(null);
        const [ok, stdout, stderr] = proc.communicate_utf8(null, null);
        this.clamdRunning = stdout.length > 0;
        return this.clamdRunning;
    }

    checkDbExists() {
        this.dbFile = Gio.File.new_for_path('/var/lib/clamav/freshclam.dat');
        this.dbExists = this.dbFile.query_exists(null);
        return this.dbExists;
    }

    updateDb(finishedCallback = () => {}) {
        const proc = this.exec(['freshclam'], true);
        proc.wait_async(null, () => { finishedCallback(proc.get_exit_status()) });
        this.checkDbExists();
    }

    startClamd() {
        this.exec(['clamd'], true);
    }

    stopClamd() {
        this.exec(['pkill', 'clamd'], true);
    }

    scanPath(pth) {
        this.exec([checkClamdRunning() ? 'clamdscan' : 'clamscan', ], true);
    }

    exec(argv, admin, flags = (Gio.SubprocessFlags.STDIN_PIPE | Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE)) {
        const args = admin ? ['pkexec', ...argv] : argv;
        return Gio.Subprocess.new(['flatpak-spawn', '--host', ...args], flags);
    }

    constructor() {
        this.checkDbExists();
        this.checkClamdRunning();

        const update_db_action = new Gio.SimpleAction({name: 'clam_update_db'});
        update_db_action.connect('activate', action => {
            this.updateDb();
        });
    }
}
