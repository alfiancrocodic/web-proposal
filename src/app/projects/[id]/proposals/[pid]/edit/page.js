"use client";
import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getProposalTemplates, getProposalContent, putProposalContent } from '@/lib/api';

const PlusIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const XIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const DEFAULT_CONTENT = {
  systemEnvironment: { platforms: [], notes: '' },
  featureSales: [],
  featureAdmin: [],
  financialBreakdown: [],
  termsOfPayment: [],
  termsAndConditions: [],
};

export default function ProposalBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id;
  const pid = params?.pid;
  const [project, setProject] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [activeTab, setActiveTab] = useState(1);
  
  // State untuk modal input
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'submodule', 'feature', 'condition'
  const [modalTitle, setModalTitle] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [modalCallback, setModalCallback] = useState(null);
  const tabs = [
    { id: 1, title: 'System Environment' },
    { id: 2, title: 'Feature Sales' },
    { id: 3, title: 'Feature Admin' },
    { id: 4, title: 'Financial Breakdown' },
    { id: 5, title: 'Terms of Payment' },
    { id: 6, title: 'Terms & Conditions' },
  ];

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('auth')) router.replace('/login');
    if (!projectId || !pid) return;
    fetch(`/api/projects/${projectId}`).then(r=>r.json()).then(setProject);
    fetch(`/api/proposals/${pid}`).then(r=>r.json()).then(setProposal);
    (async () => {
      const d = await getProposalContent(pid);
      const next = { ...DEFAULT_CONTENT, ...d };
      try {
        const tpl = await getProposalTemplates();
        const mobile = tpl?.complex?.mobile_env;
        const web = tpl?.complex?.web_env;
        const buildWithPairs = (section) => {
          const cols = section?.columns || [];
          const hasEngine = cols.some(c=>c.key==='engine');
          const hasFramework = cols.some(c=>c.key==='framework');
          const leftKey = hasEngine ? 'engine' : (hasFramework ? 'framework' : null);
          const rows = (section?.rows||[]).map((r)=>{
            if (!leftKey) return { ...r };
            const toArray = (val) => {
              if (Array.isArray(val)) return val;
              if (typeof val === 'string') {
                // try JSON array
                try { const parsed = JSON.parse(val); if (Array.isArray(parsed)) return parsed; } catch {}
                // fallback comma separated
                return val.split(',').map(s=>s.trim()).filter(Boolean);
              }
              return [];
            };
            const engines = toArray(r.values?.[leftKey]);
            const langs = toArray(r.values?.programming_language);
            const existingPairs = Array.isArray(r.pairs) ? r.pairs : [];
            const max = Math.max(engines.length, langs.length);
            const pairs = Array.from({length:max}).map((_,i)=>({
              engine: engines[i] || '',
              language: langs[i] || '',
              checked: existingPairs[i]?.checked || false,
            }));
            return { ...r, pairs };
          });
          return { rows, columns: section?.columns||[], footnotes: section?.footnotes||[], leftKey };
        };
        next.systemEnvironment = {
          ...next.systemEnvironment,
          template: { mobile, web, simple: tpl?.simple },
          mobile: buildWithPairs(mobile),
          web: buildWithPairs(web),
        };
        if (!next.termsOfPayment || next.termsOfPayment.length === 0) {
          const tp = tpl?.complex?.terms_payment;
          if (tp?.rows?.length) {
            next.termsOfPayment = tp.rows.map(r => ({
              percentage: Number(r.values?.percentage ?? 0),
              description: r.values?.description ?? '',
              total: Number(r.values?.total ?? 0),
            }));
          }
        }
        if (!next.termsAndConditions || next.termsAndConditions.length === 0) {
          const tc = tpl?.complex?.terms_conditions;
          if (tc?.rows?.length) {
            next.termsAndConditions = tc.rows.map(r => String(r.values?.term ?? ''));
          }
        }
      } catch(e) {}
      setContent(next);
    })();
  }, [router, projectId, pid]);

  const save = async () => {
    await putProposalContent(pid, content);
    router.push(`/projects/${projectId}`);
  };

  const addGroup = (key) => setContent(c => ({ ...c, [key]: [...c[key], { group: 'New Group', items: [] }] }));
  const addItem = (key, gi) => setContent(c => ({ ...c, [key]: c[key].map((g,i)=> i!==gi? g: { ...g, items: [...g.items, { name: 'New Feature', condition: '' }]}) }));
  const removeItem = (key, gi, ii) => setContent(c => ({ ...c, [key]: c[key].map((g,i)=> i!==gi? g: { ...g, items: g.items.filter((_,j)=>j!==ii) }) }));

  const addMainModule = (module) => {
    setContent(c => ({
      ...c,
      featureSales: [...c.featureSales, module]
    }));
  };

  const removeMainModule = (index) => {
    setContent(c => ({
      ...c,
      featureSales: c.featureSales.filter((_, i) => i !== index)
    }));
  };

  // Fungsi untuk membuka modal input
  const openModal = (type, title, callback) => {
    setModalType(type);
    setModalTitle(title);
    setInputValue('');
    setModalCallback(() => callback);
    setShowModal(true);
  };

  // Fungsi untuk menutup modal
  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setModalTitle('');
    setInputValue('');
    setModalCallback(null);
  };

  // Fungsi untuk submit modal
  const submitModal = () => {
    if (inputValue.trim() && modalCallback) {
      modalCallback(inputValue.trim());
      closeModal();
    }
  };

  const addSubModule = (mainIndex) => {
    openModal('submodule', 'Masukkan nama Sub Modul:', (name) => {
      const newSubModule = { 
        name: name, 
        features: [],
        subModuleId: null // Manual sub module tidak memiliki ID dari backend
      };
      setContent(c => ({
        ...c,
        featureSales: c.featureSales.map((m, i) => i !== mainIndex ? m : { ...m, sub_modules: [...m.sub_modules, newSubModule] })
      }));
    });
  };

  const removeSubModule = (mainIndex, subIndex) => {
    setContent(c => ({
      ...c,
      featureSales: c.featureSales.map((m, i) => i !== mainIndex ? m : { ...m, sub_modules: m.sub_modules.filter((_, si) => si !== subIndex) })
    }));
  };

  // Fungsi untuk menambah feature manual
  const addFeature = (mainIndex, subIndex) => {
    openModal('feature', 'Masukkan nama Feature:', (name) => {
      setContent(c => ({
        ...c,
        featureSales: c.featureSales.map((m, i) => i !== mainIndex ? m : {
          ...m,
          sub_modules: m.sub_modules.map((sm, si) => si !== subIndex ? sm : {
            ...sm,
            features: [...sm.features, { name: name, mandays: 0, conditions: [] }]
          })
        })
      }));
    });
  };

  // Fungsi untuk menambah condition manual
  const addCondition = (mainIndex, subIndex, featureIndex) => {
    openModal('condition', 'Masukkan nama Condition:', (name) => {
      setContent(c => ({
        ...c,
        featureSales: c.featureSales.map((m, i) => i !== mainIndex ? m : {
          ...m,
          sub_modules: m.sub_modules.map((sm, si) => si !== subIndex ? sm : {
            ...sm,
            features: sm.features.map((f, fi) => fi !== featureIndex ? f : {
              ...f,
              conditions: [...(f.conditions || []), { name: name, condition_text: '' }]
            })
          })
        })
      }));
    });
  };

  // Fungsi untuk menghapus condition
  const removeCondition = (mainIndex, subIndex, featureIndex, conditionIndex) => {
    setContent(c => ({
      ...c,
      featureSales: c.featureSales.map((m, i) => i !== mainIndex ? m : {
        ...m,
        sub_modules: m.sub_modules.map((sm, si) => si !== subIndex ? sm : {
          ...sm,
          features: sm.features.map((f, fi) => fi !== featureIndex ? f : {
            ...f,
            conditions: (f.conditions || []).filter((_, ci) => ci !== conditionIndex)
          })
        })
      })
    }));
  };
  
  const removeFeature = (mainIndex, subIndex, featureIndex) => {
    setContent(c => ({
      ...c,
      featureSales: c.featureSales.map((m, i) => i !== mainIndex ? m : {
        ...m,
        sub_modules: m.sub_modules.map((sm, si) => si !== subIndex ? sm : { ...sm, features: sm.features.filter((_, fi) => fi !== featureIndex) })
      })
    }));
  };

  const addSection = (key) => setContent(c => ({ ...c, [key]: [...c[key], { section: 'New Section', items: [] }] }));
  const addFbItem = (si) => setContent(c => ({ ...c, financialBreakdown: c.financialBreakdown.map((s,i)=> i!==si? s: { ...s, items: [...s.items, { activity: 'Activity', resource: 'Resource', quantity: 1, mandays: 0, price: 0, parallel: false, hide: false }]}) }));
  const currency = (n) => new Intl.NumberFormat('id-ID').format(+n||0);

  const TabFeatureSales = () => {
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedModules, setSelectedModules] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedSubModules, setSelectedSubModules] = useState({});
    const dropdownRef = useRef(null);

    // Effect untuk menutup dropdown ketika klik di luar
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowDropdown(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    // Fungsi untuk melakukan pencarian
    const handleSearch = async (searchTerm) => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }
      
      try {
        // Menggunakan backend Laravel dengan autentikasi
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/api/main-modules?search=${searchTerm}&with_sub_modules=true&with_features=true`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const response = await res.json();
        // Backend Laravel mengembalikan data dalam format { success, message, data }
        const data = response.success ? response.data.data : [];
        setSearchResults(data);
        setShowDropdown(true);
      } catch (error) {
        console.error('Error fetching modules:', error);
        setSearchResults([]);
      }
    };

    // Fungsi untuk menangani perubahan input pencarian
    const handleInputChange = (e) => {
      const value = e.target.value;
      setSearch(value);
      handleSearch(value);
    };

    // Fungsi untuk menangani seleksi sub modul
    const handleSubModuleToggle = (mainModuleId, subModuleId) => {
      setSelectedSubModules(prev => {
        const key = `${mainModuleId}-${subModuleId}`;
        const newSelection = { ...prev };
        
        if (newSelection[key]) {
          delete newSelection[key];
        } else {
          const mainModule = searchResults.find(m => m.id === mainModuleId);
          const subModule = mainModule?.sub_modules.find(sm => sm.id === subModuleId);
          if (subModule) {
            newSelection[key] = {
              mainModuleId,
              subModuleId,
              mainModuleName: mainModule.name,
              subModuleName: subModule.name,
              features: subModule.features || []
            };
          }
        }
        
        return newSelection;
      });
    };

    // Fungsi untuk menambahkan modul yang dipilih ke dalam chips
    const addSelectedModule = (module) => {
      if (!selectedModules.find(m => m.id === module.id)) {
        setSelectedModules(prev => [...prev, module]);
      }
    };

    // Fungsi untuk menghapus chip
    const removeSelectedModule = (moduleId) => {
      setSelectedModules(prev => prev.filter(m => m.id !== moduleId));
      // Hapus juga sub modul yang terkait
      setSelectedSubModules(prev => {
        const newSelection = { ...prev };
        Object.keys(newSelection).forEach(key => {
          if (key.startsWith(`${moduleId}-`)) {
            delete newSelection[key];
          }
        });
        return newSelection;
      });
    };

    // Fungsi untuk mengambil data features dan conditions dari backend
    const fetchSubModuleComplete = async (subModuleId) => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/api/sub-modules/${subModuleId}/complete`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const response = await res.json();
        return response.success ? response.data : null;
      } catch (error) {
        console.error('Error fetching sub module complete data:', error);
        return null;
      }
    };

    // Fungsi untuk menambahkan data ke tabel
    const handleAddToTable = async () => {
      const selectedData = Object.values(selectedSubModules);
      
      // Ambil data lengkap features dan conditions untuk setiap sub modul
      const enrichedData = await Promise.all(
        selectedData.map(async (item) => {
          const completeData = await fetchSubModuleComplete(item.subModuleId);
          return {
            ...item,
            features: completeData?.features || item.features || []
          };
        })
      );
      
      // Kelompokkan sub modul berdasarkan main modul
      const groupedByMainModule = enrichedData.reduce((acc, item) => {
        if (!acc[item.mainModuleName]) {
          acc[item.mainModuleName] = {
            mainModuleName: item.mainModuleName,
            subModules: []
          };
        }
        acc[item.mainModuleName].subModules.push({
          id: item.subModuleId,
          name: item.subModuleName,
          features: item.features
        });
        return acc;
      }, {});
      
      // Tambahkan atau gabungkan dengan main modul yang sudah ada
      Object.values(groupedByMainModule).forEach(group => {
        const existingMainModuleIndex = content.featureSales.findIndex(
          module => module.name === group.mainModuleName
        );
        
        if (existingMainModuleIndex >= 0) {
          // Gabungkan dengan main modul yang sudah ada
          setContent(c => ({
            ...c,
            featureSales: c.featureSales.map((module, index) => {
              if (index === existingMainModuleIndex) {
                return {
                  ...module,
                  sub_modules: [...module.sub_modules, ...group.subModules]
                };
              }
              return module;
            })
          }));
        } else {
          // Buat main modul baru
          const newModule = {
            id: Date.now() + Math.random(),
            name: group.mainModuleName,
            sub_modules: group.subModules
          };
          addMainModule(newModule);
        }
      });
      
      // Reset form
      setSearch('');
      setSearchResults([]);
      setSelectedModules([]);
      setSelectedSubModules({});
      setShowDropdown(false);
    };

    return (
        <div className="space-y-6 bg-white border rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Feature Sales</h2>
                <div className="flex items-center space-x-2">
                    <button className="px-4 py-2 text-sm font-semibold text-green-700 bg-green-100 rounded-lg">Android Phone</button>
                    <button className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg">iOS iPhone</button>
                </div>
            </div>
            
            {/* Search Form */}
            <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Pencarian Modul</h3>
                
                {/* Search Input with Chips */}
                 <div className="relative" ref={dropdownRef}>
                    <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg min-h-[50px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                        {/* Selected Module Chips */}
                        {selectedModules.map((module) => (
                            <div key={module.id} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                <span>{module.name}</span>
                                <button
                                    onClick={() => removeSelectedModule(module.id)}
                                    className="ml-2 text-blue-600 hover:text-blue-800"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        
                        {/* Search Input */}
                        <input
                            type="text"
                            value={search}
                            onChange={handleInputChange}
                            onFocus={() => search && setShowDropdown(true)}
                            placeholder={selectedModules.length === 0 ? "Cari nama Main Modul..." : ""}
                            className="flex-1 min-w-[200px] outline-none bg-transparent"
                        />
                    </div>
                    
                    {/* Dropdown Results */}
                    {showDropdown && searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                            {searchResults.map((module) => (
                                <div key={module.id} className="border-b border-gray-100 last:border-b-0">
                                    {/* Main Module Header */}
                                    <div 
                                        className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                                        onClick={() => addSelectedModule(module)}
                                    >
                                        <div>
                                            <div className="font-medium text-gray-900">{module.name}</div>
                                            <div className="text-sm text-gray-500">{module.sub_modules?.length || 0} Sub Modul</div>
                                        </div>
                                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                            Pilih
                                        </button>
                                    </div>
                                    
                                    {/* Sub Modules */}
                                    {module.sub_modules && module.sub_modules.length > 0 && (
                                        <div className="pl-6 pb-4">
                                            <div className="text-sm font-medium text-gray-700 mb-2">Sub Modul:</div>
                                            <div className="space-y-2">
                                                {module.sub_modules.map((subModule) => (
                                                    <label key={subModule.id} className="flex items-start space-x-3 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!selectedSubModules[`${module.id}-${subModule.id}`]}
                                                            onChange={() => handleSubModuleToggle(module.id, subModule.id)}
                                                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium text-gray-900">{subModule.name}</div>
                                                            {subModule.features && subModule.features.length > 0 && (
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    {subModule.features.length} Feature(s)
                                                                </div>
                                                            )}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Add Button */}
                {Object.keys(selectedSubModules).length > 0 && (
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleAddToTable}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500"
                        >
                            Add ({Object.keys(selectedSubModules).length} item)
                        </button>
                    </div>
                )}
                
                {/* Selected Sub Modules Preview */}
                {Object.keys(selectedSubModules).length > 0 && (
                    <div className="mt-4 p-4 bg-white border rounded-lg">
                        <h4 className="font-medium mb-2 text-gray-700">Sub Modul yang Dipilih:</h4>
                        <div className="space-y-2">
                            {Object.values(selectedSubModules).map((item, index) => (
                                <div key={index} className="text-sm text-gray-600">
                                    <span className="font-medium">{item.mainModuleName}</span> → {item.subModuleName}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {/* Header Tabel */}
                <div className="grid grid-cols-12 gap-x-4 text-sm font-semibold text-gray-700 px-4 py-3 bg-white border rounded-md shadow-sm">
                    <div className="col-span-2">Main Modul</div>
                    <div className="col-span-2">Sub Modul</div>
                    <div className="col-span-3">Features</div>
                    <div className="col-span-4">Condition</div>
                    <div className="col-span-1 text-right">Mandays</div>
                </div>

                {/* Konten Tabel */}
                {content.featureSales.map((mainModule, mainIndex) => (
                    <div key={mainIndex} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                        {mainModule.sub_modules.map((subModule, subIndex) => (
                            <Fragment key={subIndex}>
                                {(Array.isArray(subModule.features) && subModule.features.length > 0 ? subModule.features : [null]).map((feature, fIdx) => (
                                    <div key={`${subIndex}-${fIdx}`} className="grid grid-cols-12 gap-x-4 items-start p-4 hover:bg-gray-50 border-b last:border-b-0">
                                        {/* Main Modul - tampil di subIndex 0 dan fIdx 0 */}
                                        {(subIndex === 0 && fIdx === 0) ? (
                                            <div className="col-span-2">
                                                <div className="bg-white border border-blue-300 text-blue-800 rounded-md p-2 flex items-center justify-between">
                                                    <span className="font-semibold text-sm">{mainModule.name}</span>
                                                    <button onClick={() => removeMainModule(mainIndex)} className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50" title="Hapus Main Modul">
                                                        <XIcon className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="col-span-2"></div>
                                        )}

                                        {/* Sub Modul - tampil di fIdx 0 */}
                                        {fIdx === 0 ? (
                                            <div className="col-span-2">
                                                <div className="bg-white border rounded-md p-2 flex items-center justify-between">
                                                    <span className="font-medium text-gray-800 text-sm">{subModule.name}</span>
                                                    <button onClick={() => removeSubModule(mainIndex, subIndex)} className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50" title="Hapus Sub Modul">
                                                        <XIcon className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="col-span-2"></div>
                                        )}

                                        {/* Feature */}
                                        <div className="col-span-3">
                                            {feature ? (
                                                <div className="bg-white border rounded-md p-2 flex items-center justify-between">
                                                    <span className="text-sm">{feature.name}</span>
                                                    <button onClick={() => removeFeature(mainIndex, subIndex, fIdx)} className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50" title="Hapus Feature">
                                                        <XIcon className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : null}
                                        </div>

                                        {/* Conditions untuk feature */}
                                        <div className="col-span-4 space-y-2">
                                            {feature && Array.isArray(feature.conditions) && feature.conditions.length > 0 ? (
                                                feature.conditions.map((condition, cIdx) => (
                                                    <div key={cIdx} className="bg-white border rounded-md p-2 text-sm flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-800 text-sm">{condition.name}</div>
                                                            {condition.condition_text && (
                                                                <div className="text-gray-700 mt-1 whitespace-pre-line">{condition.condition_text}</div>
                                                            )}
                                                        </div>
                                                        <button onClick={() => removeCondition(mainIndex, subIndex, fIdx, cIdx)} className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 ml-2" title="Hapus Condition">
                                                            <XIcon className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : null}
                                            {/* Tombol Tambah Condition */}
                                            {feature && (
                                                <button className="text-blue-600 p-1 flex items-center space-x-1 rounded-md hover:bg-blue-50 border border-dashed border-blue-300 w-full text-xs" onClick={() => addCondition(mainIndex, subIndex, fIdx)}>
                                                    <PlusIcon className="w-3 h-3" /> <span>Tambah Condition</span>
                                                </button>
                                            )}
                                        </div>

                                        {/* Mandays - tampil di fIdx 0 */}
                                        {fIdx === 0 ? (
                                            <div className="col-span-1 flex justify-end">
                                                <div className="bg-blue-50 text-blue-800 font-semibold rounded-md p-2 w-16 text-center">
                                                    {subModule.features.reduce((acc, f) => (acc + (parseFloat(f.mandays) || 0)), 0)}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="col-span-1"></div>
                                        )}
                                    </div>
                                ))}

                                {/* Tombol Tambah Feature - di baris sendiri setelah daftar feature */}
                                <div className="grid grid-cols-12 gap-x-4 items-start p-4 border-b last:border-b-0">
                                    <div className="col-span-2"></div>
                                    <div className="col-span-2"></div>
                                    <div className="col-span-3">
                                        <button className="text-blue-600 p-1 flex items-center space-x-1 rounded-md hover:bg-blue-50 border border-dashed border-blue-300 w-full text-xs" onClick={() => addFeature(mainIndex, subIndex)}>
                                            <PlusIcon className="w-3 h-3" /> <span>Tambah Feature</span>
                                        </button>
                                    </div>
                                    <div className="col-span-4"></div>
                                    <div className="col-span-1"></div>
                                </div>
                            </Fragment>
                        ))}
                        <div className="px-4 py-3 bg-white border-t">
                            <button 
                                className="text-blue-600 p-1 text-xs flex items-center space-x-1 rounded-md hover:bg-blue-50 border border-dashed border-blue-300" 
                                onClick={() => addSubModule(mainIndex)}
                            >
                                <PlusIcon className="w-4 h-4" /> <span>Tambah Sub Modul</span>
                            </button>
                        </div>
                    </div>
                ))}
                
                {/* Pesan jika tidak ada data */}
                {content.featureSales.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg mb-2">Belum ada modul yang ditambahkan</p>
                        <p className="text-sm">Gunakan pencarian di atas untuk menambahkan modul</p>
                    </div>
                )}
            </div>
        </div>
    );
  };

  const TabSystem = () => {
    const { systemEnvironment } = content;
    const { mobile, web, simple } = systemEnvironment;

    const ensureSimpleInit = () => {
      if (content.systemEnvironment?.simple) return;
      const tpl = content.systemEnvironment?.template;
      const init = (arr) => (arr || []).map(opt => ({ label: opt.label, is_other: !!opt.is_other, checked: false, otherText: '' }));
      setContent(c => ({
        ...c,
        systemEnvironment: {
          ...c.systemEnvironment,
          simple: {
            frontend_lang: init(tpl?.simple?.frontend_lang),
            app_info: init(tpl?.simple?.app_info),
            account_availability: init(tpl?.simple?.account_availability),
            db_availability: init(tpl?.simple?.db_availability),
            db_info: init(tpl?.simple?.db_info),
          }
        }
      }));
    };

    useEffect(() => {
      if (!simple && content.systemEnvironment?.template && !content.systemEnvironment?.simple) {
        ensureSimpleInit();
      }
    }, [content.systemEnvironment?.template, simple]);

    // Sinkronisasi flag is_other dari template ke state simple yang sudah ada
    // Tujuan: jika konten lama belum memiliki properti is_other (mis. pada Database Information),
    // maka properti tersebut akan diisi berdasarkan template terbaru agar input "Other" bisa muncul.
    useEffect(() => {
      const tplSimple = content.systemEnvironment?.template?.simple;
      const simpleState = content.systemEnvironment?.simple;
      if (!tplSimple || !simpleState) return;

      const keys = ['frontend_lang','app_info','account_availability','db_availability','db_info'];
      let changed = false;
      const nextSimple = { ...simpleState };

      keys.forEach((k) => {
        const list = Array.isArray(simpleState[k]) ? simpleState[k] : [];
        const tplList = Array.isArray(tplSimple[k]) ? tplSimple[k] : [];

        const updatedList = list.map((item) => {
          const match = tplList.find((opt) => opt.label === item.label);
          const is_other = !!(match && match.is_other);
          if (item.is_other !== is_other) {
            changed = true;
            return { ...item, is_other };
          }
          return item;
        });

        nextSimple[k] = updatedList;
      });

      if (changed) {
        setContent((c) => ({
          ...c,
          systemEnvironment: {
            ...c.systemEnvironment,
            simple: nextSimple,
          },
        }));
      }
    }, [content.systemEnvironment?.template, content.systemEnvironment?.simple]);

    const renderTable = (data, setKey) => {
      if (!data) return null;
      const cols = data.columns || [];

      // Tentukan kolom kiri dinamis berdasarkan template (engine atau framework)
      const leftKey = data.leftKey; // bisa 'engine' atau 'framework' atau null
      const leftLabel = leftKey === 'engine' ? 'Engine' : (leftKey === 'framework' ? 'Framework' : null);

      // Definisikan header tambahan: kolom kiri (jika ada), Programming Language, dan Action
      const additionalColumns = [
        ...(leftLabel ? [{ key: leftKey, label: leftLabel }] : []),
        { key: 'programming_language', label: 'Programming Language' },
        { key: 'action', label: 'Action' },
      ];

      // Hindari duplikasi kolom dari definisi asli
      const allColumns = [
        ...cols.filter(c => c.key !== 'engine' && c.key !== 'framework' && c.key !== 'programming_language'),
        ...additionalColumns
      ];

      return (
        <div className="space-y-2">
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-300">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-700 uppercase border-b border-gray-300">
                <tr>
                  {allColumns.map(c => (<th key={c.key} className="py-3 px-2 text-left">{c.label}</th>))}
                </tr>
              </thead>
              <tbody>
                {data.rows?.map((row, idx) => {
                  const pairs = Array.isArray(row.pairs) ? row.pairs : [];
                  const rowSpan = pairs.length > 1 ? pairs.length : 1;

                  return (
                    <Fragment key={`row-${idx}`}>
                      {pairs.map((p, i) => (
                        <tr key={`${idx}-${i}-${p.engine}-${p.language}`} className="hover:bg-gray-50 align-top border-b border-gray-200">
                          {i === 0 && (
                            <Fragment>
                              {cols.filter(c => c.key !== 'engine' && c.key !== 'framework' && c.key !== 'programming_language').map(c => (
                                <td key={c.key} className="py-2 px-2 align-top" rowSpan={rowSpan}>
                                  {row.values?.[c.key] || ''}
                                </td>
                              ))}
                            </Fragment>
                          )}
                          {leftLabel && (<td className="py-2 px-2">{p.engine}</td>)}
                          <td className="py-2 px-2">{p.language}</td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={!!p.checked}
                              onChange={(e) => setContent(c => ({
                                ...c,
                                systemEnvironment: {
                                  ...c.systemEnvironment,
                                  [setKey]: {
                                    ...c.systemEnvironment[setKey],
                                    rows: c.systemEnvironment[setKey].rows.map((r, ri) =>
                                      ri !== idx ? r : {
                                        ...r,
                                        pairs: r.pairs.map((pp, pi) =>
                                          pi !== i ? pp : { ...pp, checked: e.target.checked }
                                        )
                                      }
                                    )
                                  }
                                }
                              }))}
                            />
                          </td>
                        </tr>
                      ))}
                      {pairs.length === 0 && (
                        <tr className="hover:bg-gray-50 align-top border-b border-gray-200">
                          {cols.filter(c => c.key !== 'engine' && c.key !== 'framework' && c.key !== 'programming_language').map(c => (
                            <td key={c.key} className="py-2 px-2 align-top">
                              {row.values?.[c.key] || ''}
                            </td>
                          ))}
                          {leftLabel && <td className="py-2 px-2"></td>}
                          <td className="py-2 px-2"></td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={!!row.checked}
                              onChange={(e) => setContent(c => ({
                                ...c,
                                systemEnvironment: {
                                  ...c.systemEnvironment,
                                  [setKey]: {
                                    ...c.systemEnvironment[setKey],
                                    rows: c.systemEnvironment[setKey].rows.map((r, i) =>
                                      i !== idx ? r : { ...r, checked: e.target.checked }
                                    )
                                  }
                                }
                              }))}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    const renderSimpleList = (key, title) => {
      const list = (content.systemEnvironment?.simple || {})[key] || [];
      if (!list.length) return null;
      const isRadio = key !== 'frontend_lang';

      const handleRadioChange = (idx) => {
        setContent(c => ({
          ...c,
          systemEnvironment: {
            ...c.systemEnvironment,
            simple: {
              ...c.systemEnvironment.simple,
              [key]: c.systemEnvironment.simple[key].map((it, i) => ({ ...it, checked: i === idx }))
            }
          }
        }));
      };

      const handleCheckboxChange = (e, idx) => {
        setContent(c => ({
          ...c,
          systemEnvironment: {
            ...c.systemEnvironment,
            simple: {
              ...c.systemEnvironment.simple,
              [key]: c.systemEnvironment.simple[key].map((it, i) => i !== idx ? it : { ...it, checked: e.target.checked })
            }
          }
        }));
      }

      return (
        <div className="space-y-2">
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-300">
            <div className="p-4">
              <h3 className="font-semibold mb-2">{title}</h3>
              <div className="flex flex-row flex-wrap gap-4">
                {list.map((item, idx) => (
                  <div key={idx} className="flex items-center">
                    <input
                      type={isRadio ? "radio" : "checkbox"}
                      id={`${key}-${idx}`}
                      name={key}
                      value={item.label}
                      checked={!!item.checked}
                      onChange={isRadio ? () => handleRadioChange(idx) : (e) => handleCheckboxChange(e, idx)}
                      className="mr-2"
                    />
                    <label htmlFor={`${key}-${idx}`} className="text-sm">{item.label}</label>
                    {item.is_other && item.checked && (
                      <input
                        placeholder="Please specify..."
                        value={item.otherText || ''}
                        onChange={(e)=> setContent(c=> ({
                          ...c,
                          systemEnvironment: {
                            ...c.systemEnvironment,
                            simple: {
                              ...c.systemEnvironment.simple,
                              [key]: c.systemEnvironment.simple[key].map((it,i)=> i!==idx ? it : { ...it, otherText: e.target.value })
                            }
                          }
                        }))}
                        className="ml-2 border border-gray-300 rounded p-1 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Mobile System Environment</h3>
          {renderTable(mobile, 'mobile')}
          {mobile?.footnotes?.length ? (
            <ul className="text-xs text-gray-500 list-disc ml-5 mt-2">
              {mobile.footnotes.map((f,i)=>(<li key={i}>{f}</li>))}
            </ul>
          ) : null}
        </div>
        <div>
          <h3 className="font-semibold mb-2">Web System Environment</h3>
          {renderTable(web, 'web')}
          {web?.footnotes?.length ? (
            <ul className="text-xs text-gray-500 list-disc ml-5 mt-2">
              {web.footnotes.map((f,i)=>(<li key={i}>{f}</li>))}
            </ul>
          ) : null}
        </div>



        {renderSimpleList('frontend_lang', 'Frontend Interface Language')}
        {renderSimpleList('app_info', 'Application Information')}
        {renderSimpleList('account_availability', 'Account Availability')}
        {renderSimpleList('db_availability', 'Database Availability')}
        {renderSimpleList('db_info', 'Database Information')}
      </div>
    );
  };

  const TabFeatures = ({keyName}) => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={()=>addGroup(keyName)} className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white">+ Group</button>
      </div>
      {content[keyName].map((g, gi) => (
        <div key={gi} className="bg-white rounded-lg border p-4 space-y-3">
          <input value={g.group} onChange={e=> setContent(c=> ({...c, [keyName]: c[keyName].map((x,i)=> i!==gi?x:{...x, group:e.target.value})}))} className="w-full border border-gray-300 rounded p-2 font-semibold" />
          <div className="grid grid-cols-12 gap-3 text-sm">
            <div className="col-span-5 font-bold text-gray-600">Feature</div>
            <div className="col-span-6 font-bold text-gray-600">Condition</div>
            <div className="col-span-1"></div>
            {g.items.map((it, ii) => (
              <Fragment key={`${keyName}-${gi}-${ii}`}>
                <div className="col-span-5"><input value={it.name} onChange={e=> setContent(c=> ({...c, [keyName]: c[keyName].map((x,i)=> i!==gi?x:{...x, items: x.items.map((y,j)=> j!==ii?y:{...y, name:e.target.value})})}))} className="w-full border border-gray-300 rounded p-2" /></div>
                <div className="col-span-6"><textarea value={it.condition||''} onChange={e=> setContent(c=> ({...c, [keyName]: c[keyName].map((x,i)=> i!==gi?x:{...x, items: x.items.map((y,j)=> j!==ii?y:{...y, condition:e.target.value})})}))} className="w-full border border-gray-300 rounded p-2" rows={2} /></div>
                <div className="col-span-1 flex items-center justify-end"><button onClick={()=>removeItem(keyName, gi, ii)} className="text-gray-500">✕</button></div>
              </Fragment>
            ))}
            <div className="col-span-12">
              <button onClick={()=>addItem(keyName, gi)} className="px-3 py-1 text-sm rounded border border-gray-300">+ Feature</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const TabFinancial = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={addSection} className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white">+ Section</button>
      </div>
      <div className="overflow-x-auto bg-white p-4 rounded-lg border">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-700 uppercase">
            <tr>
              <th className="py-3 px-2 text-left">Section/Activity</th>
              <th className="py-3 px-2 text-left">Resource</th>
              <th className="py-3 px-2 text-center">Qty</th>
              <th className="py-3 px-2 text-center">Mandays</th>
              <th className="py-3 px-2 text-right">Price</th>
              <th className="py-3 px-2 text-center">Parallel</th>
              <th className="py-3 px-2 text-center">Hide</th>
            </tr>
          </thead>
          <tbody>
            {content.financialBreakdown.map((sec, si) => (
              <Fragment key={`fb-section-${si}`}>
                <tr key={`sec-${si}`}>
                  <td colSpan={7} className="pt-4 pb-2">
                    <div className="flex items-center">
                      <input value={sec.section} onChange={e=> setContent(c=> ({...c, financialBreakdown: c.financialBreakdown.map((s,i)=> i!==si? s : { ...s, section: e.target.value })}))} className="font-semibold border border-gray-300 rounded p-2" />
                      <button onClick={()=> setContent(c=> ({...c, financialBreakdown: c.financialBreakdown.filter((_,i)=>i!==si)}))} className="ml-2 text-gray-500">✕</button>
                    </div>
                  </td>
                </tr>
                {sec.items.map((it, ii) => (
                  <tr key={`it-${si}-${ii}`} className="hover:bg-gray-50">
                    <td className="py-2 px-2"><input value={it.activity} onChange={e=> setContent(c=> ({...c, financialBreakdown: c.financialBreakdown.map((s,i)=> i!==si? s : { ...s, items: s.items.map((x,j)=> j!==ii? x : { ...x, activity: e.target.value })})}))} className="w-full border border-gray-300 rounded p-1" /></td>
                    <td className="py-2 px-2"><input value={it.resource} onChange={e=> setContent(c=> ({...c, financialBreakdown: c.financialBreakdown.map((s,i)=> i!==si? s : { ...s, items: s.items.map((x,j)=> j!==ii? x : { ...x, resource: e.target.value })})}))} className="w-full border border-gray-300 rounded p-1" /></td>
                    <td className="py-2 px-2 text-center"><input type="number" value={it.quantity} onChange={e=> setContent(c=> ({...c, financialBreakdown: c.financialBreakdown.map((s,i)=> i!==si? s : { ...s, items: s.items.map((x,j)=> j!==ii? x : { ...x, quantity: +e.target.value })})}))} className="w-20 border border-gray-300 rounded p-1 text-center" /></td>
                    <td className="py-2 px-2 text-center"><input type="number" value={it.mandays} onChange={e=> setContent(c=> ({...c, financialBreakdown: c.financialBreakdown.map((s,i)=> i!==si? s : { ...s, items: s.items.map((x,j)=> j!==ii? x : { ...x, mandays: +e.target.value })})}))} className="w-20 border border-gray-300 rounded p-1 text-center" /></td>
                    <td className="py-2 px-2 text-right"><input type="number" value={it.price} onChange={e=> setContent(c=> ({...c, financialBreakdown: c.financialBreakdown.map((s,i)=> i!==si? s : { ...s, items: s.items.map((x,j)=> j!==ii? x : { ...x, price: +e.target.value })})}))} className="w-32 border border-gray-300 rounded p-1 text-right" /></td>
                    <td className="py-2 px-2 text-center"><input type="checkbox" checked={!!it.parallel} onChange={e=> setContent(c=> ({...c, financialBreakdown: c.financialBreakdown.map((s,i)=> i!==si? s : { ...s, items: s.items.map((x,j)=> j!==ii? x : { ...x, parallel: e.target.checked })})}))} /></td>
                    <td className="py-2 px-2 text-center"><input type="checkbox" checked={!!it.hide} onChange={e=> setContent(c=> ({...c, financialBreakdown: c.financialBreakdown.map((s,i)=> i!==si? s : { ...s, items: s.items.map((x,j)=> j!==ii? x : { ...x, hide: e.target.checked })})}))} /></td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={7} className="py-2"><button onClick={()=>addFbItem(si)} className="px-3 py-1 text-sm border border-gray-300 rounded">+ Item</button></td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const TabPayment = () => (
    <div className="space-y-3">
      <div className="overflow-x-auto bg-white p-4 rounded-lg border">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-700 uppercase">
            <tr>
              <th className="py-3 px-2 text-left w-12">No.</th>
              <th className="py-3 px-2 text-left w-28">Percentage (%)</th>
              <th className="py-3 px-2 text-left">Description</th>
              <th className="py-3 px-2 text-right w-40">Total</th>
              <th className="py-3 px-2 text-center w-12"></th>
            </tr>
          </thead>
          <tbody>
            {content.termsOfPayment.map((t, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="py-2 px-2 align-top">{i + 1}</td>
                <td className="py-2 px-2 align-top">
                  <input type="number" value={t.percentage}
                    onChange={e=> setContent(c=> ({...c, termsOfPayment: c.termsOfPayment.map((x,idx)=> idx!==i? x : { ...x, percentage: +e.target.value })}))}
                    className="w-24 bg-gray-50 border rounded p-2" />
                </td>
                <td className="py-2 px-2">
                  <input value={t.description}
                    onChange={e=> setContent(c=> ({...c, termsOfPayment: c.termsOfPayment.map((x,idx)=> idx!==i? x : { ...x, description: e.target.value })}))}
                    className="w-full bg-gray-50 border rounded p-2" />
                </td>
                <td className="py-2 px-2 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-xs text-gray-500">Rp</span>
                    <input type="number" value={t.total}
                      onChange={e=> setContent(c=> ({...c, termsOfPayment: c.termsOfPayment.map((x,idx)=> idx!==i? x : { ...x, total: +e.target.value })}))}
                      className="w-32 bg-gray-50 border rounded p-2 text-right" />
                  </div>
                </td>
                <td className="py-2 px-2 text-center">
                  <button className="text-red-500" title="Remove" onClick={()=> setContent(c=> ({...c, termsOfPayment: c.termsOfPayment.filter((_,idx)=>idx!==i)}))}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="text-blue-600 text-sm" onClick={()=> setContent(c=> ({...c, termsOfPayment: [...c.termsOfPayment, { percentage: 0, description: '', total: 0 }]}))}>+ Add term</button>
    </div>
  );

  const TabTerms = () => (
    <div className="space-y-3">
      <div className="overflow-x-auto bg-white p-4 rounded-lg border">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-700 uppercase">
            <tr>
              <th className="py-3 px-2 text-left w-12">No.</th>
              <th className="py-3 px-2 text-left">Terms & Conditions</th>
              <th className="py-3 px-2 text-center w-12"></th>
            </tr>
          </thead>
          <tbody>
            {content.termsAndConditions.map((t, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="py-2 px-2 align-top">{i + 1}</td>
                <td className="py-2 px-2">
                  <textarea value={t}
                    onChange={e=> setContent(c=> ({...c, termsAndConditions: c.termsAndConditions.map((x,idx)=> idx!==i? x : e.target.value)}))}
                    className="w-full bg-gray-50 border rounded p-2" rows={2} />
                </td>
                <td className="py-2 px-2 text-center">
                  <button className="text-red-500" title="Remove" onClick={()=> setContent(c=> ({...c, termsAndConditions: c.termsAndConditions.filter((_,idx)=>idx!==i)}))}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="text-blue-600 text-sm" onClick={()=> setContent(c=> ({...c, termsAndConditions: [...c.termsAndConditions, '']}))}>+ Add term</button>
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 1: return <TabSystem />;
      case 2: return <TabFeatureSales />;
      case 3: return <TabFeatures keyName="featureAdmin"/>;
      case 4: return <TabFinancial />;
      case 5: return <TabPayment />;
      case 6: return <TabTerms />;
      default: return null;
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <Header />
      <main className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-6 space-y-6">
        <Breadcrumbs crumbs={["Home","Project", project?.name || 'Project', `Proposal V${proposal?.version || ''}`, 'Edit']} />
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Proposal {project?.name}</h1>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
              <span>Version: {proposal?.version}</span>
              <span>Date: {proposal ? new Date(proposal.createdAt).toLocaleDateString() : ''}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>router.push(`/projects/${projectId}`)} className="p-2 rounded-md border hover:bg-gray-100">Back</button>
            <button onClick={save} className="bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-700">Save Proposal</button>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                {tab.id}. {tab.title}
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-white p-6 rounded-lg">
          {renderTab()}
        </div>
      </main>
      
      {/* Modal untuk input nama */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[9999]" onClick={closeModal}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-md mx-4 relative" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 mb-4">{modalTitle}</h3>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && submitModal()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan nama..."
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Batal
              </button>
              <button
                onClick={submitModal}
                disabled={!inputValue.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
