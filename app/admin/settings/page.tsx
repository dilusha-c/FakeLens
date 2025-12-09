import { Settings as SettingsIcon, Shield, Bell, Globe } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-[var(--text-secondary)] mt-2">Configure system-wide settings and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Security Settings */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Shield className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Security</h2>
              <p className="text-[var(--text-secondary)] text-sm">Manage security and authentication settings</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-tertiary)]">
              <div>
                <p className="text-[var(--text-primary)] font-medium">Two-Factor Authentication</p>
                <p className="text-[var(--text-secondary)] text-sm">Require 2FA for admin accounts</p>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-full h-full bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-color)]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-tertiary)]">
              <div>
                <p className="text-[var(--text-primary)] font-medium">Session Timeout</p>
                <p className="text-[var(--text-secondary)] text-sm">Auto logout after inactivity (minutes)</p>
              </div>
              <input
                type="number"
                defaultValue={30}
                className="w-20 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)]"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Bell className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Notifications</h2>
              <p className="text-[var(--text-secondary)] text-sm">Configure system notification preferences</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-tertiary)]">
              <div>
                <p className="text-[var(--text-primary)] font-medium">Email Notifications</p>
                <p className="text-[var(--text-secondary)] text-sm">Receive alerts via email</p>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-full h-full bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-color)]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-tertiary)]">
              <div>
                <p className="text-[var(--text-primary)] font-medium">User Activity Alerts</p>
                <p className="text-[var(--text-secondary)] text-sm">Get notified of suspicious activity</p>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-full h-full bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-color)]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-green-500/10">
              <Globe className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">General</h2>
              <p className="text-[var(--text-secondary)] text-sm">General application settings</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-tertiary)]">
              <div>
                <p className="text-[var(--text-primary)] font-medium">Public Registrations</p>
                <p className="text-[var(--text-secondary)] text-sm">Allow new users to register</p>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-full h-full bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-color)]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-tertiary)]">
              <div>
                <p className="text-[var(--text-primary)] font-medium">Maintenance Mode</p>
                <p className="text-[var(--text-secondary)] text-sm">Disable access for maintenance</p>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-full h-full bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-color)]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-3 bg-[var(--accent-color)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
