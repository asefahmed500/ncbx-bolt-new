import React from 'react';
import { Palette, Type, Layout, Settings, Layers, Eye, Lock, Copy, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const PropertiesPanel: React.FC = () => {
  const { selectedComponent } = useAppStore();
  const [activeTab, setActiveTab] = React.useState('style');

  // Mock component data - in real app this would come from the canvas
  const [componentData, setComponentData] = React.useState({
    id: selectedComponent || '',
    type: 'text',
    content: 'Sample text content',
    styles: {
      fontSize: '16px',
      fontWeight: 'normal',
      color: '#374151',
      backgroundColor: 'transparent',
      padding: '8px',
      margin: '0px',
      borderRadius: '4px',
      textAlign: 'left',
      lineHeight: '1.5'
    },
    position: { x: 100, y: 100 },
    size: { width: 200, height: 100 },
    layer: 1,
    locked: false,
    hidden: false
  });

  const tabs = [
    { id: 'content', name: 'Content', icon: <Type className="h-4 w-4" /> },
    { id: 'style', name: 'Style', icon: <Palette className="h-4 w-4" /> },
    { id: 'layout', name: 'Layout', icon: <Layout className="h-4 w-4" /> },
    { id: 'layers', name: 'Layers', icon: <Layers className="h-4 w-4" /> },
    { id: 'advanced', name: 'Advanced', icon: <Settings className="h-4 w-4" /> }
  ];

  const fontFamilies = [
    'Inter, sans-serif',
    'Roboto, sans-serif',
    'Open Sans, sans-serif',
    'Lato, sans-serif',
    'Montserrat, sans-serif',
    'Poppins, sans-serif',
    'Playfair Display, serif',
    'Merriweather, serif',
    'Georgia, serif',
    'Times New Roman, serif'
  ];

  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '64px'];
  const fontWeights = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];

  if (!selectedComponent) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">🎨</div>
          <h3 className="text-lg font-semibold mb-2">No Element Selected</h3>
          <p className="text-sm mb-4">Click on an element in the canvas to edit its properties</p>
          <div className="text-xs space-y-1 text-gray-400">
            <p>💡 Double-click text to edit inline</p>
            <p>🎯 Use the layers panel to organize</p>
            <p>⌨️ Keyboard shortcuts available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Component Info Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm font-medium text-gray-900 capitalize">
              {componentData.type} Element
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              className="p-1 hover:bg-gray-200 rounded"
              title="Toggle visibility"
            >
              <Eye className="h-3 w-3 text-gray-600" />
            </button>
            <button
              className="p-1 hover:bg-gray-200 rounded"
              title="Lock/unlock"
            >
              <Lock className="h-3 w-3 text-gray-600" />
            </button>
            <button
              className="p-1 hover:bg-gray-200 rounded"
              title="Duplicate"
            >
              <Copy className="h-3 w-3 text-gray-600" />
            </button>
            <button
              className="p-1 hover:bg-red-200 rounded"
              title="Delete"
            >
              <Trash2 className="h-3 w-3 text-red-600" />
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          ID: {selectedComponent} • Layer: {componentData.layer}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center px-3 py-3 text-sm font-medium transition-colors min-w-0 flex-1 ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            <span className="ml-1 hidden sm:inline">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Properties Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              {componentData.type === 'text' || componentData.type === 'heading' ? (
                <textarea
                  value={componentData.content}
                  onChange={(e) => setComponentData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Enter your text content..."
                />
              ) : componentData.type === 'button' ? (
                <input
                  type="text"
                  value={componentData.content}
                  onChange={(e) => setComponentData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Button text"
                />
              ) : (
                <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                  Content editing not available for this component type.
                </div>
              )}
            </div>

            {(componentData.type === 'button' || componentData.type === 'text') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link (Optional)
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
                <div className="mt-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">Open in new tab</span>
                  </label>
                </div>
              </div>
            )}

            {componentData.type === 'image' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Source
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                  placeholder="https://example.com/image.jpg"
                />
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  Upload Image
                </button>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alt Text
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the image"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-6">
            {/* Typography */}
            {(componentData.type === 'text' || componentData.type === 'heading' || componentData.type === 'button') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Typography
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Font Family</label>
                    <select 
                      value={componentData.styles.fontFamily || 'Inter, sans-serif'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      {fontFamilies.map(font => (
                        <option key={font} value={font} style={{ fontFamily: font }}>
                          {font.split(',')[0]}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                      <select 
                        value={componentData.styles.fontSize}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        {fontSizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Font Weight</label>
                      <select 
                        value={componentData.styles.fontWeight}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        {fontWeights.map(weight => (
                          <option key={weight} value={weight}>
                            {weight === '400' ? 'Normal' : weight === '700' ? 'Bold' : weight}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Text Color</label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={componentData.styles.color}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={componentData.styles.color}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Text Alignment</label>
                    <div className="grid grid-cols-4 gap-1">
                      {['left', 'center', 'right', 'justify'].map(align => (
                        <button
                          key={align}
                          className={`px-3 py-2 border rounded-lg text-sm capitalize transition-colors ${
                            componentData.styles.textAlign === align
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Line Height</label>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={componentData.styles.lineHeight}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 text-center mt-1">
                      {componentData.styles.lineHeight}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Background & Colors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Background & Colors
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Background Color</label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={componentData.styles.backgroundColor === 'transparent' ? '#ffffff' : componentData.styles.backgroundColor}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={componentData.styles.backgroundColor}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                      placeholder="transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    defaultValue="1"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Spacing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Spacing
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Padding</label>
                  <input
                    type="text"
                    value={componentData.styles.padding}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="8px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Margin</label>
                  <input
                    type="text"
                    value={componentData.styles.margin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="0px"
                  />
                </div>
              </div>
            </div>

            {/* Border & Effects */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Border & Effects
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Border Radius</label>
                  <input
                    type="text"
                    value={componentData.styles.borderRadius}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="4px"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Box Shadow</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                    <option value="none">None</option>
                    <option value="0 1px 3px rgba(0,0,0,0.1)">Small</option>
                    <option value="0 4px 6px rgba(0,0,0,0.1)">Medium</option>
                    <option value="0 10px 15px rgba(0,0,0,0.1)">Large</option>
                    <option value="0 25px 50px rgba(0,0,0,0.25)">Extra Large</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Position
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">X Position</label>
                  <input
                    type="number"
                    value={componentData.position.x}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Y Position</label>
                  <input
                    type="number"
                    value={componentData.position.y}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Size
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Width</label>
                  <input
                    type="number"
                    value={componentData.size.width}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Height</label>
                  <input
                    type="number"
                    value={componentData.size.height}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center space-x-2">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs text-gray-600">Lock aspect ratio</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Display
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Display Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                    <option value="block">Block</option>
                    <option value="inline">Inline</option>
                    <option value="inline-block">Inline Block</option>
                    <option value="flex">Flex</option>
                    <option value="grid">Grid</option>
                    <option value="none">Hidden</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Z-Index (Layer)</label>
                  <input
                    type="number"
                    value={componentData.layer}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Responsive Visibility
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

        {activeTab === 'layers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">Layer Management</h4>
              <div className="flex items-center space-x-1">
                <button className="p-1 hover:bg-gray-100 rounded text-xs">
                  ↑
                </button>
                <button className="p-1 hover:bg-gray-100 rounded text-xs">
                  ↓
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {/* Mock layer list */}
              {[
                { id: '3', name: 'Button', type: 'button', layer: 3, visible: true, locked: false },
                { id: '2', name: 'Text Content', type: 'text', layer: 2, visible: true, locked: false },
                { id: '1', name: 'Heading', type: 'heading', layer: 1, visible: true, locked: false }
              ].map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center space-x-2 p-2 rounded-lg border transition-colors ${
                    selectedComponent === item.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-gray-500 capitalize">({item.type})</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Eye className="h-3 w-3 text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Lock className="h-3 w-3 text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h5 className="text-xs font-medium text-gray-700 mb-2">Layer Actions</h5>
              <div className="grid grid-cols-2 gap-2">
                <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors">
                  Bring Forward
                </button>
                <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors">
                  Send Backward
                </button>
                <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors">
                  Bring to Front
                </button>
                <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors">
                  Send to Back
                </button>
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
                value={componentData.id}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                placeholder="unique-id"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSS Classes
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="class1 class2 class3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom CSS
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={8}
                placeholder="/* Custom CSS styles */
.my-element {
  /* Your styles here */
  transform: rotate(45deg);
  transition: all 0.3s ease;
}

.my-element:hover {
  transform: scale(1.1);
}"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Animation
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mb-3">
                <option value="none">No Animation</option>
                <option value="fadeIn">Fade In</option>
                <option value="slideUp">Slide Up</option>
                <option value="slideDown">Slide Down</option>
                <option value="slideLeft">Slide Left</option>
                <option value="slideRight">Slide Right</option>
                <option value="zoomIn">Zoom In</option>
                <option value="bounce">Bounce</option>
                <option value="pulse">Pulse</option>
              </select>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Duration (ms)</label>
                  <input
                    type="number"
                    defaultValue="300"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Delay (ms)</label>
                  <input
                    type="number"
                    defaultValue="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interactions
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">On Click</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                    <option value="none">No Action</option>
                    <option value="link">Open Link</option>
                    <option value="modal">Open Modal</option>
                    <option value="scroll">Scroll to Section</option>
                    <option value="toggle">Toggle Element</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1">On Hover</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                    <option value="none">No Action</option>
                    <option value="scale">Scale</option>
                    <option value="rotate">Rotate</option>
                    <option value="fade">Fade</option>
                    <option value="glow">Glow Effect</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO & Accessibility
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">ARIA Label</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Descriptive label for screen readers"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tab Index</label>
                  <input
                    type="number"
                    defaultValue="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;