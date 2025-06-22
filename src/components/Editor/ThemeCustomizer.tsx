import React from 'react';
import { Palette, Type, Spacing, Zap, Download, Upload, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = React.useState('colors');
  const [theme, setTheme] = React.useState({
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#06d6a0',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      headingFont: 'Inter, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem'
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75'
      }
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
      '3xl': '4rem'
    },
    borderRadius: {
      none: '0',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    }
  });

  const tabs = [
    { id: 'colors', name: 'Colors', icon: <Palette className="h-4 w-4" /> },
    { id: 'typography', name: 'Typography', icon: <Type className="h-4 w-4" /> },
    { id: 'spacing', name: 'Spacing', icon: <Spacing className="h-4 w-4" /> },
    { id: 'effects', name: 'Effects', icon: <Zap className="h-4 w-4" /> }
  ];

  const colorPresets = [
    {
      name: 'Ocean Blue',
      colors: {
        primary: '#0ea5e9',
        secondary: '#3b82f6',
        accent: '#06b6d4'
      }
    },
    {
      name: 'Forest Green',
      colors: {
        primary: '#059669',
        secondary: '#10b981',
        accent: '#34d399'
      }
    },
    {
      name: 'Sunset Orange',
      colors: {
        primary: '#ea580c',
        secondary: '#f97316',
        accent: '#fb923c'
      }
    },
    {
      name: 'Purple Dream',
      colors: {
        primary: '#7c3aed',
        secondary: '#8b5cf6',
        accent: '#a78bfa'
      }
    },
    {
      name: 'Rose Gold',
      colors: {
        primary: '#e11d48',
        secondary: '#f43f5e',
        accent: '#fb7185'
      }
    }
  ];

  const fontPairs = [
    {
      name: 'Modern Sans',
      heading: 'Inter, sans-serif',
      body: 'Inter, sans-serif'
    },
    {
      name: 'Classic Serif',
      heading: 'Playfair Display, serif',
      body: 'Source Serif Pro, serif'
    },
    {
      name: 'Elegant Mix',
      heading: 'Montserrat, sans-serif',
      body: 'Open Sans, sans-serif'
    },
    {
      name: 'Bold & Clean',
      heading: 'Poppins, sans-serif',
      body: 'Lato, sans-serif'
    }
  ];

  const handleColorChange = (colorKey: string, value: string) => {
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value
      }
    }));
  };

  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        ...preset.colors
      }
    }));
  };

  const applyFontPair = (fontPair: typeof fontPairs[0]) => {
    setTheme(prev => ({
      ...prev,
      typography: {
        ...prev.typography,
        fontFamily: fontPair.body,
        headingFont: fontPair.heading
      }
    }));
  };

  const exportTheme = () => {
    const themeData = JSON.stringify(theme, null, 2);
    const blob = new Blob([themeData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedTheme = JSON.parse(e.target?.result as string);
          setTheme(importedTheme);
        } catch (error) {
          console.error('Invalid theme file');
        }
      };
      reader.readAsText(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex"
      >
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Theme Customizer</h3>
            <p className="text-sm text-gray-600">Customize your website's appearance</p>
          </div>
          
          <div className="flex-1 p-4">
            <nav className="space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-4 border-t border-gray-200 space-y-2">
            <button
              onClick={exportTheme}
              className="w-full flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export Theme</span>
            </button>
            
            <label className="w-full flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
              <Upload className="h-4 w-4" />
              <span>Import Theme</span>
              <input
                type="file"
                accept=".json"
                onChange={importTheme}
                className="hidden"
              />
            </label>
            
            <button className="w-full flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <RotateCcw className="h-4 w-4" />
              <span>Reset to Default</span>
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h4 className="text-xl font-semibold text-gray-900 capitalize">
              {activeTab} Settings
            </h4>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'colors' && (
              <div className="space-y-8">
                {/* Color Presets */}
                <div>
                  <h5 className="text-lg font-medium text-gray-900 mb-4">Color Presets</h5>
                  <div className="grid grid-cols-2 gap-4">
                    {colorPresets.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => applyColorPreset(preset)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left"
                      >
                        <div className="flex space-x-2 mb-2">
                          <div 
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: preset.colors.primary }}
                          ></div>
                          <div 
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: preset.colors.secondary }}
                          ></div>
                          <div 
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: preset.colors.accent }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Custom Colors */}
                <div>
                  <h5 className="text-lg font-medium text-gray-900 mb-4">Custom Colors</h5>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(theme.colors).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                            className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'typography' && (
              <div className="space-y-8">
                {/* Font Pairs */}
                <div>
                  <h5 className="text-lg font-medium text-gray-900 mb-4">Font Combinations</h5>
                  <div className="space-y-4">
                    {fontPairs.map((pair, index) => (
                      <button
                        key={index}
                        onClick={() => applyFontPair(pair)}
                        className="w-full p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left"
                      >
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-900">{pair.name}</span>
                        </div>
                        <div style={{ fontFamily: pair.heading }} className="text-xl font-bold text-gray-900 mb-1">
                          Heading Example
                        </div>
                        <div style={{ fontFamily: pair.body }} className="text-gray-600">
                          Body text example with this font combination
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Font Sizes */}
                <div>
                  <h5 className="text-lg font-medium text-gray-900 mb-4">Font Sizes</h5>
                  <div className="space-y-3">
                    {Object.entries(theme.typography.fontSize).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-4">
                        <label className="w-16 text-sm font-medium text-gray-700 capitalize">
                          {key}
                        </label>
                        <input
                          type="text"
                          value={value}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                        <div style={{ fontSize: value }} className="text-gray-900">
                          Sample
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'spacing' && (
              <div className="space-y-8">
                <div>
                  <h5 className="text-lg font-medium text-gray-900 mb-4">Spacing Scale</h5>
                  <div className="space-y-3">
                    {Object.entries(theme.spacing).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-4">
                        <label className="w-16 text-sm font-medium text-gray-700 capitalize">
                          {key}
                        </label>
                        <input
                          type="text"
                          value={value}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                        <div 
                          className="bg-blue-200 rounded"
                          style={{ width: value, height: '1rem' }}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h5 className="text-lg font-medium text-gray-900 mb-4">Border Radius</h5>
                  <div className="space-y-3">
                    {Object.entries(theme.borderRadius).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-4">
                        <label className="w-16 text-sm font-medium text-gray-700 capitalize">
                          {key}
                        </label>
                        <input
                          type="text"
                          value={value}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                        <div 
                          className="w-8 h-8 bg-blue-200 border border-blue-300"
                          style={{ borderRadius: value }}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'effects' && (
              <div className="space-y-8">
                <div>
                  <h5 className="text-lg font-medium text-gray-900 mb-4">Box Shadows</h5>
                  <div className="space-y-4">
                    {Object.entries(theme.shadows).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 capitalize">
                          {key} Shadow
                        </label>
                        <input
                          type="text"
                          value={value}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                        <div 
                          className="w-full h-16 bg-white border border-gray-200 rounded-lg"
                          style={{ boxShadow: value }}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Apply Theme
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ThemeCustomizer;