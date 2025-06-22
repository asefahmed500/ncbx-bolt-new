import React from 'react';
import { Palette, Type, Layout, Settings } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const PropertiesPanel: React.FC = () => {
  const { selectedComponent } = useAppStore();
  const [activeTab, setActiveTab] = React.useState('style');

  const tabs = [
    { id: 'style', name: 'Style', icon: <Palette className="h-4 w-4" /> },
    { id: 'content', name: 'Content', icon: <Type className="h-4 w-4" /> },
    { id: 'layout', name: 'Layout', icon: <Layout className="h-4 w-4" /> },
    { id: 'advanced', name: 'Advanced', icon: <Settings className="h-4 w-4" /> }
  ];

  if (!selectedComponent) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">🎨</div>
          <h3 className="text-lg font-semibold mb-2">No Element Selected</h3>
          <p className="text-sm">Click on an element in the canvas to edit its properties</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center px-2 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            <span className="ml-1 hidden sm:inline">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Properties Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'style' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Typography
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>12px</option>
                    <option>14px</option>
                    <option>16px</option>
                    <option>18px</option>
                    <option>24px</option>
                    <option>32px</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Font Weight</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Normal</option>
                    <option>Medium</option>
                    <option>Semibold</option>
                    <option>Bold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Text Color</label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      className="w-10 h-10 border border-gray-300 rounded-lg"
                      defaultValue="#374151"
                    />
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue="#374151"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Background Color</label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      className="w-10 h-10 border border-gray-300 rounded-lg"
                      defaultValue="#ffffff"
                    />
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue="#ffffff"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spacing
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Padding</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue="16"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Margin</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue="0"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Border
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Border Radius</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue="8"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Content
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                defaultValue="Edit your text content here..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link (Optional)
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">Open in new tab</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">X Position</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue="50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Y Position</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue="50"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Width</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue="auto"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Height</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue="auto"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alignment
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Left', 'Center', 'Right'].map(align => (
                  <button
                    key={align}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Element ID
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="unique-id"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSS Classes
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="class1 class2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom CSS
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={6}
                placeholder="/* Custom CSS styles */
.my-element {
  /* Your styles here */
}"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                  <span className="text-sm text-gray-700">Visible on Desktop</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                  <span className="text-sm text-gray-700">Visible on Tablet</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                  <span className="text-sm text-gray-700">Visible on Mobile</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;