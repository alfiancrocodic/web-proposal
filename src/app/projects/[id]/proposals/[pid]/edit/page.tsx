"use client";
import { useEffect, useMemo, useState, Fragment, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import { ShimmerBox, ShimmerForm } from '@/components/ShimmerEffect';
import { getProposalTemplates, getProposalContent, putProposalContent, getProject, getProposal, searchMainModules, getSubModuleComplete } from '@/lib/api';

// Icon Components
const PlusIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const XIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// Type definitions
interface Project {
  id: number;
  name: string;
  roles: string[] | { name: string }[];
}

interface Proposal {
  id: number;
  version: string;
  createdAt: string;
}

interface Feature {
  id?: number;
  name: string;
  mandays: number | string;
  conditions: { id?: number; name: string }[];
}

interface SubModule {
  id?: number;
  name: string;
  features: Feature[];
  subModuleId?: number | null;
}

interface MainModule {
  id: number | string;
  name: string;
  sub_modules: SubModule[];
}

interface FinancialItem {
  activity: string;
  resource: string;
  quantity: number;
  mandays: number;
  price: number;
  parallel: boolean;
  hide: boolean;
}

interface FinancialSection {
  section: string;
  items: FinancialItem[];
}

interface PaymentTerm {
  percentage: number;
  description: string;
  total: number;
}

interface SystemEnvironmentPair {
  engine: string;
  language: string;
  checked: boolean;
}

interface SystemEnvironmentRow {
  values?: Record<string, any>;
  pairs: SystemEnvironmentPair[];
  checked?: boolean;
}

interface SystemEnvironmentSection {
  rows: SystemEnvironmentRow[];
  columns: { key: string; label: string }[];
  footnotes: string[];
  leftKey?: string;
}

interface SimpleOption {
  label: string;
  is_other: boolean;
  checked: boolean;
  otherText?: string;
}

interface Content {
  systemEnvironment: {
    platforms?: string[];
    notes?: string;
    template?: any;
    mobile?: SystemEnvironmentSection;
    web?: SystemEnvironmentSection;
    simple?: {
      frontend_lang?: SimpleOption[];
      app_info?: SimpleOption[];
      account_availability?: SimpleOption[];
      db_availability?: SimpleOption[];
      db_info?: SimpleOption[];
    };
  };
  featuresByRole: Record<string, MainModule[]>;
  financialBreakdown: FinancialSection[];
  termsOfPayment: PaymentTerm[];
  termsAndConditions: string[];
  // Legacy fields for migration
  featureSales?: any[];
  featureAdmin?: any[];
}

const DEFAULT_CONTENT: Content = {
  systemEnvironment: { platforms: [], notes: '' },
  featuresByRole: {},
  financialBreakdown: [],
  termsOfPayment: [],
  termsAndConditions: [],
};

export default function ProposalBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;
  const pid = params?.pid as string;
  const [project, setProject] = useState<Project | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [content, setContent] = useState<Content>(DEFAULT_CONTENT);
  const [activeTab, setActiveTab] = useState('system');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // State untuk modal input
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'submodule', 'feature', 'condition'
  const [modalTitle, setModalTitle] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [modalCallback, setModalCallback] = useState<((value: string) => void) | null>(null);

  const tabs = useMemo(() => {
    const rawRoles = Array.isArray(project?.roles) ? project.roles : [];
    const roleTabs = rawRoles.map((r, idx) => {
      const name = typeof r === 'string' ? r : (r?.name || '');
      const roleName = String(name || '').trim();
      const safe = roleName || `Role ${idx + 1}`;
      return {
        key: `role:${safe}`,
        title: safe,
        type: 'role',
        roleName: roleName || safe,
      };
    });
    return [
      { key: 'system', title: 'System Environment', type: 'system' },
      ...roleTabs,
      { key: 'financial', title: 'Financial Breakdown', type: 'financial' },
      { key: 'payment', title: 'Terms of Payment', type: 'payment' },
      { key: 'terms', title: 'Terms & Conditions', type: 'terms' },
    ];
  }, [project?.roles]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('auth_token')) {
      router.replace('/login');
      return;
    }
    if (!projectId || !pid) return;
    
    (async () => {
      try {
        setIsLoading(true);
        
        // Use backend API helpers (Laravel)
        const [projectData, proposalData] = await Promise.all([
          getProject(parseInt(projectId)).catch(() => null),
          getProposal(parseInt(pid)).catch(() => null)
        ]);
        
        setProject(projectData);
        setProposal(proposalData);
        
        const d = await getProposalContent(parseInt(pid));
        const next: Content = { ...DEFAULT_CONTENT, ...d };
        
        try {
          const tpl = await getProposalTemplates();
          const mobile = tpl?.complex?.mobile_env;
          const web = tpl?.complex?.web_env;
          
          const buildWithPairs = (section: any): SystemEnvironmentSection => {
            const cols = section?.columns || [];
            const hasEngine = cols.some((c: any) => c.key === 'engine');
            const hasFramework = cols.some((c: any) => c.key === 'framework');
            const leftKey = hasEngine ? 'engine' : (hasFramework ? 'framework' : undefined);
            
            const rows = (section?.rows || []).map((r: any) => {
              if (!leftKey) return { ...r };
              
              const toArray = (val: any): string[] => {
                if (Array.isArray(val)) return val;
                if (typeof val === 'string') {
                  try { 
                    const parsed = JSON.parse(val); 
                    if (Array.isArray(parsed)) return parsed; 
                  } catch {}
                  return val.split(',').map(s => s.trim()).filter(Boolean);
                }
                return [];
              };
              
              const engines = toArray(r.values?.[leftKey]);
              const langs = toArray(r.values?.programming_language);
              const existingPairs = Array.isArray(r.pairs) ? r.pairs : [];
              const max = Math.max(engines.length, langs.length);
              
              const pairs = Array.from({length: max}).map((_, i) => ({
                engine: engines[i] || '',
                language: langs[i] || '',
                checked: existingPairs[i]?.checked || false,
              }));
              
              return { ...r, pairs };
            });
            
            return { 
              rows, 
              columns: section?.columns || [], 
              footnotes: section?.footnotes || [], 
              leftKey 
            };
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
            next.termsOfPayment = tp.rows.map((r: any) => ({
              percentage: Number(r.values?.percentage ?? 0),
              description: r.values?.description ?? '',
              total: Number(r.values?.total ?? 0),
            }));
          }
        }
        
        if (!next.termsAndConditions || next.termsAndConditions.length === 0) {
          const tc = tpl?.complex?.terms_conditions;
          if (tc?.rows?.length) {
            next.termsAndConditions = tc.rows.map((r: any) => String(r.values?.term ?? ''));
          }
        }
      } catch(e) {}

        // Migrasi data lama ke struktur baru featuresByRole
      if (Array.isArray(next.featureSales) && next.featureSales.length) {
        next.featuresByRole = {
          ...(next.featuresByRole || {}),
          ['Sales']: next.featureSales,
        };
        delete next.featureSales;
      }
      
      if (Array.isArray(next.featureAdmin) && next.featureAdmin.length) {
        const subModules = next.featureAdmin.map((g: any) => ({
          name: g?.group || 'General',
          features: (Array.isArray(g?.items) ? g.items : []).map((it: any) => ({
            name: it?.name || 'Feature',
            mandays: 0,
            conditions: it?.condition ? [{ name: it.condition }] : [],
          })),
        }));
        const adminModule = [{ id: Date.now() + Math.random(), name: 'Admin', sub_modules: subModules }];
        next.featuresByRole = {
          ...(next.featuresByRole || {}),
          ['Admin']: adminModule,
        };
        delete next.featureAdmin;
      }

      setContent(next);
      } catch (error) {
        console.error('Error loading proposal data:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [router, projectId, pid]);

  const save = async () => {
    try {
      setIsSaving(true);
      await putProposalContent(parseInt(pid), content);
      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error('Error saving proposal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Helpers for role-based feature modules storage
  const getRoleModules = (roleName: string, state = content): MainModule[] => {
    const rn = String(roleName || '').trim();
    if (!state.featuresByRole) return [];
    return state.featuresByRole[rn] || [];
  };

  const setRoleModules = (roleName: string, updater: MainModule[] | ((prev: MainModule[]) => MainModule[])) => {
    const rn = String(roleName || '').trim();
    setContent((c) => {
      const prev = getRoleModules(rn, c) || [];
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return {
        ...c,
        featuresByRole: {
          ...(c.featuresByRole || {}),
          [rn]: next,
        },
      };
    });
  };

  // Fungsi untuk membuka modal input
  const openModal = (type: string, title: string, callback: (value: string) => void) => {
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

  const addSection = (key: keyof Content) => setContent(c => ({ 
    ...c, 
    [key]: [...(c[key] as any[]), { section: 'New Section', items: [] }] 
  }));
  
  const addFbItem = (si: number) => setContent(c => ({ 
    ...c, 
    financialBreakdown: c.financialBreakdown.map((s, i) => 
      i !== si ? s : { 
        ...s, 
        items: [...s.items, { 
          activity: 'Activity', 
          resource: 'Resource', 
          quantity: 1, 
          mandays: 0, 
          price: 0, 
          parallel: false, 
          hide: false 
        }]
      }
    ) 
  }));
  
  const currency = (n: number) => new Intl.NumberFormat('id-ID').format(+n || 0);

  // Role feature tab component
  const TabRoleFeatureModules = ({ roleName }: { roleName: string }) => {
    const rn = (roleName || '').trim();
    const modules = getRoleModules(rn);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedModules, setSelectedModules] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedSubModules, setSelectedSubModules] = useState<Record<string, any>>({});
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Memoize update functions
    const updateFeatureMandays = useCallback((mainIndex: number, subIndex: number, fIdx: number, value: string | number) => {
      setRoleModules(rn, (prev) => prev.map((m, i) => i !== mainIndex ? m : ({
        ...m,
        sub_modules: m.sub_modules.map((sm, si) => si !== subIndex ? sm : ({
          ...sm,
          features: sm.features.map((f, fi) => fi !== fIdx ? f : ({ 
            ...f, 
            mandays: value === '' ? '' : (isNaN(Number(value)) ? f.mandays : Number(value))
          }))
        }))
      })));
    }, [rn, setRoleModules]);

    // State lokal untuk input values
    const [localInputValues, setLocalInputValues] = useState<Record<string, string>>({});
    const activeInputRef = useRef<HTMLInputElement | null>(null);
    const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
    
    const handleMandaysBlur = useCallback((mainIndex: number, subIndex: number, fIdx: number, inputId: string, currentValue?: string) => {
      const value = currentValue !== undefined ? currentValue : (localInputValues[inputId] || '');
      updateFeatureMandays(mainIndex, subIndex, fIdx, value);
      setLocalInputValues(prev => {
        const next = { ...prev };
        delete next[inputId];
        return next;
      });
    }, [localInputValues, updateFeatureMandays]);
    
    const handleMandaysChange = useCallback((mainIndex: number, subIndex: number, fIdx: number, value: string, inputId: string) => {
      setLocalInputValues(prev => ({
        ...prev,
        [inputId]: value
      }));
    }, []);

    useEffect(() => {
    return () => {
        Object.values(timeoutRefs.current).forEach(timeout => {
          if (timeout) clearTimeout(timeout);
        });
      };
    }, []);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setShowDropdown(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (searchTerm: string) => {
      if (!searchTerm.trim()) { 
        setSearchResults([]); 
        setShowDropdown(false); 
        return; 
      }
      
      try {
        const data = await searchMainModules({ search: searchTerm, with_sub_modules: true, with_features: true });
        const nameKey = (o: any) => (o && o.name ? String(o.name).toLowerCase().trim() : '');
        const seen = new Set();
        const modules = [];
        
        for (const m of (Array.isArray(data) ? data : [])) {
          if (!m) continue;
          const k = nameKey(m) || (m.id != null ? String(m.id) : '');
          if (seen.has(k)) continue;
          seen.add(k);
          
          const subs = Array.isArray(m.sub_modules) ? m.sub_modules : [];
          const seenSub = new Set();
          const uniqSubs = [];
          
          for (const sm of subs) {
            if (!sm) continue;
            const sk = nameKey(sm) || (sm.id != null ? String(sm.id) : '');
            if (seenSub.has(sk)) continue;
            seenSub.add(sk);
            uniqSubs.push(sm);
          }
          
          modules.push({ ...m, sub_modules: uniqSubs });
        }
        
        setSearchResults(modules);
        setShowDropdown(true);
      } catch (e) {
        console.error('Error fetching modules:', e);
        setSearchResults([]);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
      const v = e.target.value; 
      setSearch(v); 
      handleSearch(v); 
    };

    const handleSubModuleToggle = (mainModuleId: number, subModuleId: number) => {
      setSelectedSubModules(prev => {
        const key = `${mainModuleId}-${subModuleId}`;
        const next = { ...prev };
        
        if (next[key]) {
          delete next[key];
        } else {
          const mainModule = searchResults.find(m => m.id === mainModuleId);
          const subModule = mainModule?.sub_modules.find((sm: any) => sm.id === subModuleId);
          if (subModule) {
            next[key] = { 
              mainModuleId, 
              subModuleId, 
              mainModuleName: mainModule.name, 
              subModuleName: subModule.name, 
              features: subModule.features || [] 
            };
          }
        }
        return next;
      });
    };

    const addSelectedModule = (module: any) => { 
      if (!selectedModules.find(m => m.id === module.id)) {
        setSelectedModules(prev => [...prev, module]); 
      }
    };
    
    const removeSelectedModule = (moduleId: number) => {
      setSelectedModules(prev => prev.filter(m => m.id !== moduleId));
      setSelectedSubModules(prev => { 
        const next = { ...prev }; 
        Object.keys(next).forEach(k => { 
          if (k.startsWith(`${moduleId}-`)) delete next[k]; 
        }); 
        return next; 
      });
    };

    const fetchSubModuleComplete = async (subModuleId: number) => {
      try {
        return await getSubModuleComplete(subModuleId);
      } catch (e) {
        console.error('Error fetching sub module complete data:', e);
        return null;
      }
    };

    const handleAddToTable = async () => {
      const selectedData = Object.values(selectedSubModules);
      const enrichedData = await Promise.all(selectedData.map(async (item: any) => {
        const completeData = await fetchSubModuleComplete(item.subModuleId);
        return { ...item, features: completeData?.features || item.features || [] };
      }));
      
      const grouped = enrichedData.reduce((acc: any, item: any) => {
        if (!acc[item.mainModuleName]) {
          acc[item.mainModuleName] = { mainModuleName: item.mainModuleName, subModules: [] };
        }
        acc[item.mainModuleName].subModules.push({ 
          id: item.subModuleId, 
          name: item.subModuleName, 
          features: item.features 
        });
        return acc;
      }, {});
      
      setRoleModules(rn, (prev) => {
        let next = Array.isArray(prev) ? [...prev] : [];
        Object.values(grouped).forEach((group: any) => {
          const idx = next.findIndex((m) => m.name === group.mainModuleName);
          if (idx >= 0) {
            next[idx] = { 
              ...next[idx], 
              sub_modules: [...(next[idx].sub_modules || []), ...group.subModules] 
            };
          } else {
            next.push({ 
              id: Date.now() + Math.random(), 
              name: group.mainModuleName, 
              sub_modules: group.subModules 
            });
          }
        });
        return next;
      });
      
      setSearch(''); 
      setSearchResults([]); 
      setSelectedModules([]); 
      setSelectedSubModules({}); 
      setShowDropdown(false);
    };

    return (
      <div className="space-y-6 bg-white border rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{rn} Features</h2>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 text-sm font-semibold text-green-700 bg-green-100 rounded-lg">Android Phone</button>
            <button className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg">iOS iPhone</button>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Pencarian Modul</h3>
          <div className="relative" ref={dropdownRef}>
            <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg min-h-[50px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
              {selectedModules.map((module) => (
                <div key={module.id} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  <span>{module.name}</span>
                  <button onClick={() => removeSelectedModule(module.id)} className="ml-2 text-blue-600 hover:text-blue-800">×</button>
                </div>
              ))}
              <input 
                type="text" 
                value={search} 
                onChange={handleInputChange} 
                onFocus={() => search && setShowDropdown(true)} 
                placeholder={selectedModules.length === 0 ? "Cari nama Main Modul..." : ""} 
                className="flex-1 min-w-[200px] outline-none bg-transparent" 
              />
            </div>
            
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                {searchResults.map((module) => (
                  <div key={module.id} className="border-b border-gray-100 last:border-b-0">
                    <div className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center" onClick={() => addSelectedModule(module)}>
                      <div>
                        <div className="font-medium text-gray-900">{module.name}</div>
                        <div className="text-sm text-gray-500">{module.sub_modules?.length || 0} Sub Modul</div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Pilih</button>
                    </div>
                    {module.sub_modules && module.sub_modules.length > 0 && (
                      <div className="pl-6 pb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">Sub Modul:</div>
                        <div className="space-y-2">
                          {module.sub_modules.map((subModule: any) => (
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
                                  <div className="text-xs text-gray-500 mt-1">{subModule.features.length} Feature(s)</div>
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
          
          {Object.keys(selectedSubModules).length > 0 && (
            <div className="mt-4 flex justify-end">
              <button onClick={handleAddToTable} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500">
                Add ({Object.keys(selectedSubModules).length} item)
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="space-y-6">
          <div className="grid gap-x-4 text-sm font-semibold text-gray-700 px-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 80px' }}>
            <div>Main Modul</div>
            <div>Sub Modul</div>
            <div>Features</div>
            <div>Condition</div>
            <div className="text-right">Mandays</div>
          </div>
          
          {modules.map((mainModule, mainIndex) => (
            <div key={`m-${mainModule?.id ?? mainIndex}`} className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
              {mainModule.sub_modules.map((subModule, subIndex) => (
                <Fragment key={`sm-${subModule?.id ?? subIndex}`}>
                  {(Array.isArray(subModule.features) && subModule.features.length > 0 ? subModule.features : [null]).map((feature, fIdx) => {
                    const stableKey = feature?.id ? `feature-${feature.id}` : `${mainIndex}-${subIndex}-${fIdx}`;
                    return (
                      <div key={stableKey} className="grid gap-x-4 items-start p-4 hover:bg-gray-50 border-b border-gray-200 last:border-b-0" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 80px' }}>
                        {(subIndex === 0 && fIdx === 0) ? (
                          <div>
                            <div className="bg-white border border-blue-300 text-blue-800 rounded-md p-2 flex items-center justify-between">
                              <span className="font-semibold text-sm">{mainModule.name}</span>
                              <button 
                                onClick={() => setRoleModules(rn, (prev) => prev.filter((_, i) => i !== mainIndex))} 
                                className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50" 
                                title="Hapus Main Modul"
                              >
                                <XIcon className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (<div></div>)}

                        {fIdx === 0 ? (
                          <div>
                            <div className="bg-white border rounded-md p-2 flex items-center justify-between">
                              <span className="font-medium text-gray-800 text-sm">{subModule.name}</span>
                              <button 
                                onClick={() => setRoleModules(rn, (prev) => prev.map((m, i) => i !== mainIndex ? m : { 
                                  ...m, 
                                  sub_modules: m.sub_modules.filter((_, si) => si !== subIndex) 
                                }))} 
                                className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50" 
                                title="Hapus Sub Modul"
                              >
                                <XIcon className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (<div></div>)}

                        <div>
                          {feature ? (
                            <div className="flex items-center justify-between">
                              <input 
                                value={feature.name} 
                                onChange={(e) => setRoleModules(rn, (prev) => prev.map((m, i) => i !== mainIndex ? m : { 
                                  ...m, 
                                  sub_modules: m.sub_modules.map((sm, si) => si !== subIndex ? sm : { 
                                    ...sm, 
                                    features: sm.features.map((f, fi) => fi !== fIdx ? f : { 
                                      ...f, 
                                      name: e.target.value 
                                    }) 
                                  }) 
                                }))} 
                                className="w-full border border-gray-300 rounded p-2 text-sm" 
                              />
                              <button 
                                onClick={() => setRoleModules(rn, (prev) => prev.map((m, i) => i !== mainIndex ? m : { 
                                  ...m, 
                                  sub_modules: m.sub_modules.map((sm, si) => si !== subIndex ? sm : { 
                                    ...sm, 
                                    features: sm.features.filter((_, fi) => fi !== fIdx) 
                                  }) 
                                }))} 
                                className="ml-2 text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50" 
                                title="Hapus Feature"
                              >
                                <XIcon className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm italic">—</span>
                          )}
                        </div>
                        
                        <div>
                          {feature ? (
                            <div className="space-y-2">
                              {(Array.isArray(feature.conditions) ? feature.conditions : []).map((cond, cIdx) => (
                                <div key={`cond-${cond?.id ?? cIdx}`} className="flex items-center gap-2">
                                  <input 
                                    value={cond.name} 
                                    onChange={(e) => setRoleModules(rn, (prev) => prev.map((m, i) => i !== mainIndex ? m : { 
                                      ...m, 
                                      sub_modules: m.sub_modules.map((sm, si) => si !== subIndex ? sm : { 
                                        ...sm, 
                                        features: sm.features.map((f, fi) => fi !== fIdx ? f : { 
                                          ...f, 
                                          conditions: (f.conditions || []).map((cc, ci) => ci !== cIdx ? cc : { 
                                            ...cc, 
                                            name: e.target.value 
                                          }) 
                                        }) 
                                      }) 
                                    }))} 
                                    className="flex-1 border border-gray-300 rounded p-2 text-sm" 
                                    placeholder="Condition" 
                                  />
                                  <button 
                                    onClick={() => setRoleModules(rn, (prev) => prev.map((m, i) => i !== mainIndex ? m : { 
                                      ...m, 
                                      sub_modules: m.sub_modules.map((sm, si) => si !== subIndex ? sm : { 
                                        ...sm, 
                                        features: sm.features.map((f, fi) => fi !== fIdx ? f : { 
                                          ...f, 
                                          conditions: (f.conditions || []).filter((_, ci) => ci !== cIdx) 
                                        }) 
                                      }) 
                                    }))} 
                                    className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50" 
                                    title="Hapus Condition"
                                  >
                                    <XIcon className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              <button 
                                className="text-blue-600 p-1 text-xs flex items-center space-x-1 rounded-md hover:bg-blue-50 border border-dashed border-blue-300" 
                                onClick={() => openModal('condition', 'Masukkan nama Condition:', (name) => setRoleModules(rn, (prev) => prev.map((m, i) => i !== mainIndex ? m : { 
                                  ...m, 
                                  sub_modules: m.sub_modules.map((sm, si) => si !== subIndex ? sm : { 
                                    ...sm, 
                                    features: sm.features.map((f, fi) => fi !== fIdx ? f : { 
                                      ...f, 
                                      conditions: [...(f.conditions || []), { name }] 
                                    }) 
                                  }) 
                                })))}
                              >
                                <PlusIcon className="w-3 h-3" /> <span>Tambah Condition</span>
                              </button>
                            </div>
                          ) : (<span className="text-gray-400 text-sm italic">—</span>)}
                        </div>
                        
                        <div className="text-right">
                          {feature ? (
                            <input
                              ref={(el) => {
                                if (el && document.activeElement === el) {
                                  activeInputRef.current = el;
                                }
                              }}
                              type="text"
                              inputMode="decimal"
                              pattern="[0-9]*\.?[0-9]*"
                              value={(() => {
                                const inputId = `mandays-${mainIndex}-${subIndex}-${fIdx}`;
                                const currentValue = localInputValues[inputId] !== undefined 
                                  ? localInputValues[inputId] 
                                  : (feature.mandays ?? '');
                                
                                if (localInputValues[inputId] !== undefined) {
                                  return currentValue;
                                }
                                
                                if (currentValue !== '' && !isNaN(Number(currentValue))) {
                                  const numValue = Number(currentValue);
                                  return numValue % 1 === 0 ? numValue.toString() : numValue.toString();
                                }
                                return currentValue;
                              })()}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                  const inputId = `mandays-${mainIndex}-${subIndex}-${fIdx}`;
                                  activeInputRef.current = e.target;
                                  handleMandaysChange(mainIndex, subIndex, fIdx, val, inputId);
                                }
                              }}
                              onFocus={(e) => {
                                (e.target as any).dataset.scrollTop = window.scrollY;
                                activeInputRef.current = e.target;
                              }}
                              onBlur={(e) => {
                                const savedScrollTop = parseInt((e.target as any).dataset.scrollTop || '0');
                                if (Math.abs(window.scrollY - savedScrollTop) > 50) {
                                  window.scrollTo({ top: savedScrollTop, behavior: 'instant' });
                                }
                                if (activeInputRef.current === e.target) {
                                  activeInputRef.current = null;
                                }
                                const inputId = `mandays-${mainIndex}-${subIndex}-${fIdx}`;
                                const currentValue = e.target.value;
                                handleMandaysBlur(mainIndex, subIndex, fIdx, inputId, currentValue);
                              }}
                              className="w-20 border border-gray-300 rounded p-2 text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0"
                            />
                          ) : (
                            <span className="text-gray-400 text-sm italic">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Add Feature row */}
                  <div className="grid gap-x-4 items-start p-4 border-b border-gray-200 last:border-b-0" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 80px' }}>
                    <div></div>
                    <div></div>
                    <div>
                      <button 
                        className="text-blue-600 p-1 flex items-center space-x-1 rounded-md hover:bg-blue-50 border border-dashed border-blue-300 w-full text-xs" 
                        onClick={() => openModal('feature', 'Masukkan nama Feature:', (name) => setRoleModules(rn, (prev) => prev.map((m, i) => i !== mainIndex ? m : { 
                          ...m, 
                          sub_modules: m.sub_modules.map((sm, si) => si !== subIndex ? sm : { 
                            ...sm, 
                            features: [...(sm.features || []), { name, mandays: 0, conditions: [] }] 
                          }) 
                        })))}
                      >
                        <PlusIcon className="w-3 h-3" /> <span>Tambah Feature</span>
                      </button>
                    </div>
                    <div></div>
                    <div></div>
                  </div>
                </Fragment>
              ))}
              
              <div className="px-4 py-3 bg-white border-t border-gray-300">
                <button 
                  className="text-blue-600 p-1 text-xs flex items-center space-x-1 rounded-md hover:bg-blue-50 border border-dashed border-blue-300" 
                  onClick={() => openModal('submodule', 'Masukkan nama Sub Modul:', (name) => setRoleModules(rn, (prev) => prev.map((m, i) => i !== mainIndex ? m : { 
                    ...m, 
                    sub_modules: [...(m.sub_modules || []), { name, features: [], subModuleId: null }] 
                  })))}
                >
                  <PlusIcon className="w-4 h-4" /> <span>Tambah Sub Modul</span>
                </button>
              </div>
            </div>
          ))}
          
          {modules.length === 0 && (
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
      const init = (arr: any[]) => (arr || []).map((opt: any) => ({ 
        label: opt.label, 
        is_other: !!opt.is_other, 
        checked: false, 
        otherText: '' 
      }));
      
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

    useEffect(() => {
      const tplSimple = content.systemEnvironment?.template?.simple;
      if (!tplSimple) return;
      
      const keys = ['frontend_lang','app_info','account_availability','db_availability','db_info'];
      setContent((c) => {
        const simpleState = c.systemEnvironment?.simple;
        if (!simpleState) return c;
        
        let changed = false;
        const nextSimple = { ...simpleState };
        
        keys.forEach((k) => {
          const list = Array.isArray((simpleState as any)[k]) ? (simpleState as any)[k] : [];
          const tplList = Array.isArray(tplSimple[k]) ? tplSimple[k] : [];
          
          const updatedList = list.map((item: any) => {
            const match = tplList.find((opt: any) => opt.label === item.label);
            const is_other = !!(match && match.is_other);
            if (item.is_other !== is_other) { 
              changed = true; 
              return { ...item, is_other }; 
            }
            return item;
          });
          
          (nextSimple as any)[k] = updatedList;
        });
        
        if (!changed) return c;
        return {
          ...c,
          systemEnvironment: { ...c.systemEnvironment, simple: nextSimple }
        };
      });
    }, [content.systemEnvironment?.template]);

    const renderTable = (data: SystemEnvironmentSection | undefined, setKey: string) => {
      if (!data) return null;
      const cols = data.columns || [];

      const leftKey = data.leftKey;
      const leftLabel = leftKey === 'engine' ? 'Engine' : (leftKey === 'framework' ? 'Framework' : null);

      const additionalColumns = [
        ...(leftLabel ? [{ key: leftKey, label: leftLabel }] : []),
        { key: 'programming_language', label: 'Programming Language' },
        { key: 'action', label: 'Action' },
      ];

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
                                    ...(c.systemEnvironment as any)[setKey],
                                    rows: (c.systemEnvironment as any)[setKey].rows.map((r: any, ri: number) =>
                                      ri !== idx ? r : {
                                        ...r,
                                        pairs: r.pairs.map((pp: any, pi: number) =>
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
                                    ...(c.systemEnvironment as any)[setKey],
                                    rows: (c.systemEnvironment as any)[setKey].rows.map((r: any, i: number) =>
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

    // Local input for "Other" to avoid full-state re-renders while typing
    const OtherTextInput = ({ value, onCommit }: { value: string; onCommit: (val: string) => void }) => {
      const [val, setVal] = useState(value || '');
      useEffect(() => { setVal(value || ''); }, [value]);
      return (
        <input
          placeholder="Please specify..."
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => onCommit(val)}
          className="ml-2 border border-gray-300 rounded p-1 text-sm"
        />
      );
    };

    const renderSimpleList = (key: string, title: string) => {
      const list = (content.systemEnvironment?.simple as any)?.[key] || [];
      if (!list.length) return null;
      const isRadio = key !== 'frontend_lang';

      const handleRadioChange = (idx: number) => {
        setContent(c => ({
          ...c,
          systemEnvironment: {
            ...c.systemEnvironment,
            simple: {
              ...c.systemEnvironment.simple,
              [key]: (c.systemEnvironment.simple as any)[key].map((it: any, i: number) => ({ 
                ...it, 
                checked: i === idx 
              }))
            }
          }
        }));
      };

      const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
        setContent(c => ({
          ...c,
          systemEnvironment: {
            ...c.systemEnvironment,
            simple: {
              ...c.systemEnvironment.simple,
              [key]: (c.systemEnvironment.simple as any)[key].map((it: any, i: number) => 
                i !== idx ? it : { ...it, checked: e.target.checked }
              )
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
                {list.map((item: any, idx: number) => (
                  <div key={`${item.label || idx}`} className="flex items-center">
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
                      <OtherTextInput
                        value={item.otherText || ''}
                        onCommit={(val) => setContent(c => ({
                          ...c,
                          systemEnvironment: {
                            ...c.systemEnvironment,
                            simple: {
                              ...c.systemEnvironment.simple,
                              [key]: (c.systemEnvironment.simple as any)[key].map((it: any, i: number) => 
                                i !== idx ? it : { ...it, otherText: val }
                              )
                            }
                          }
                        }))}
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
              {mobile.footnotes.map((f, i) => (<li key={i}>{f}</li>))}
            </ul>
          ) : null}
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Web System Environment</h3>
          {renderTable(web, 'web')}
          {web?.footnotes?.length ? (
            <ul className="text-xs text-gray-500 list-disc ml-5 mt-2">
              {web.footnotes.map((f, i) => (<li key={i}>{f}</li>))}
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

  const TabFinancial = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => addSection('financialBreakdown')} className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white">+ Section</button>
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
                      <input 
                        value={sec.section} 
                        onChange={e => setContent(c => ({
                          ...c, 
                          financialBreakdown: c.financialBreakdown.map((s, i) => 
                            i !== si ? s : { ...s, section: e.target.value }
                          )
                        }))} 
                        className="font-semibold border border-gray-300 rounded p-2" 
                      />
                      <button 
                        onClick={() => setContent(c => ({
                          ...c, 
                          financialBreakdown: c.financialBreakdown.filter((_, i) => i !== si)
                        }))} 
                        className="ml-2 text-gray-500"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
                {sec.items.map((it, ii) => (
                  <tr key={`it-${si}-${ii}`} className="hover:bg-gray-50">
                    <td className="py-2 px-2">
                      <input 
                        value={it.activity} 
                        onChange={e => setContent(c => ({
                          ...c, 
                          financialBreakdown: c.financialBreakdown.map((s, i) => 
                            i !== si ? s : { 
                              ...s, 
                              items: s.items.map((x, j) => 
                                j !== ii ? x : { ...x, activity: e.target.value }
                              )
                            }
                          )
                        }))} 
                        className="w-full border border-gray-300 rounded p-1" 
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input 
                        value={it.resource} 
                        onChange={e => setContent(c => ({
                          ...c, 
                          financialBreakdown: c.financialBreakdown.map((s, i) => 
                            i !== si ? s : { 
                              ...s, 
                              items: s.items.map((x, j) => 
                                j !== ii ? x : { ...x, resource: e.target.value }
                              )
                            }
                          )
                        }))} 
                        className="w-full border border-gray-300 rounded p-1" 
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <input 
                        type="number" 
                        value={it.quantity} 
                        onChange={e => setContent(c => ({
                          ...c, 
                          financialBreakdown: c.financialBreakdown.map((s, i) => 
                            i !== si ? s : { 
                              ...s, 
                              items: s.items.map((x, j) => 
                                j !== ii ? x : { ...x, quantity: +e.target.value }
                              )
                            }
                          )
                        }))} 
                        className="w-20 border border-gray-300 rounded p-1 text-center" 
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <input 
                        type="number" 
                        value={it.mandays} 
                        onChange={e => setContent(c => ({
                          ...c, 
                          financialBreakdown: c.financialBreakdown.map((s, i) => 
                            i !== si ? s : { 
                              ...s, 
                              items: s.items.map((x, j) => 
                                j !== ii ? x : { ...x, mandays: +e.target.value }
                              )
                            }
                          )
                        }))} 
                        className="w-20 border border-gray-300 rounded p-1 text-center" 
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input 
                        type="number" 
                        value={it.price} 
                        onChange={e => setContent(c => ({
                          ...c, 
                          financialBreakdown: c.financialBreakdown.map((s, i) => 
                            i !== si ? s : { 
                              ...s, 
                              items: s.items.map((x, j) => 
                                j !== ii ? x : { ...x, price: +e.target.value }
                              )
                            }
                          )
                        }))} 
                        className="w-32 border border-gray-300 rounded p-1 text-right" 
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <input 
                        type="checkbox" 
                        checked={!!it.parallel} 
                        onChange={e => setContent(c => ({
                          ...c, 
                          financialBreakdown: c.financialBreakdown.map((s, i) => 
                            i !== si ? s : { 
                              ...s, 
                              items: s.items.map((x, j) => 
                                j !== ii ? x : { ...x, parallel: e.target.checked }
                              )
                            }
                          )
                        }))} 
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <input 
                        type="checkbox" 
                        checked={!!it.hide} 
                        onChange={e => setContent(c => ({
                          ...c, 
                          financialBreakdown: c.financialBreakdown.map((s, i) => 
                            i !== si ? s : { 
                              ...s, 
                              items: s.items.map((x, j) => 
                                j !== ii ? x : { ...x, hide: e.target.checked }
                              )
                            }
                          )
                        }))} 
                      />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={7} className="py-2">
                    <button onClick={() => addFbItem(si)} className="px-3 py-1 text-sm border border-gray-300 rounded">+ Item</button>
                  </td>
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
                  <input 
                    type="number" 
                    value={t.percentage}
                    onChange={e => setContent(c => ({
                      ...c, 
                      termsOfPayment: c.termsOfPayment.map((x, idx) => 
                        idx !== i ? x : { ...x, percentage: +e.target.value }
                      )
                    }))}
                    className="w-24 bg-gray-50 border rounded p-2" 
                  />
                </td>
                <td className="py-2 px-2">
                  <input 
                    value={t.description}
                    onChange={e => setContent(c => ({
                      ...c, 
                      termsOfPayment: c.termsOfPayment.map((x, idx) => 
                        idx !== i ? x : { ...x, description: e.target.value }
                      )
                    }))}
                    className="w-full bg-gray-50 border rounded p-2" 
                  />
                </td>
                <td className="py-2 px-2 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-xs text-gray-500">Rp</span>
                    <input 
                      type="number" 
                      value={t.total}
                      onChange={e => setContent(c => ({
                        ...c, 
                        termsOfPayment: c.termsOfPayment.map((x, idx) => 
                          idx !== i ? x : { ...x, total: +e.target.value }
                        )
                      }))}
                      className="w-32 bg-gray-50 border rounded p-2 text-right" 
                    />
                  </div>
                </td>
                <td className="py-2 px-2 text-center">
                  <button 
                    className="text-red-500" 
                    title="Remove" 
                    onClick={() => setContent(c => ({
                      ...c, 
                      termsOfPayment: c.termsOfPayment.filter((_, idx) => idx !== i)
                    }))}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button 
        className="text-blue-600 text-sm" 
        onClick={() => setContent(c => ({
          ...c, 
          termsOfPayment: [...c.termsOfPayment, { percentage: 0, description: '', total: 0 }]
        }))}
      >
        + Add term
      </button>
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
                  <textarea 
                    value={t}
                    onChange={e => setContent(c => ({
                      ...c, 
                      termsAndConditions: c.termsAndConditions.map((x, idx) => 
                        idx !== i ? x : e.target.value
                      )
                    }))}
                    className="w-full bg-gray-50 border rounded p-2" 
                    rows={2} 
                  />
                </td>
                <td className="py-2 px-2 text-center">
                  <button 
                    className="text-red-500" 
                    title="Remove" 
                    onClick={() => setContent(c => ({
                      ...c, 
                      termsAndConditions: c.termsAndConditions.filter((_, idx) => idx !== i)
                    }))}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button 
        className="text-blue-600 text-sm" 
        onClick={() => setContent(c => ({
          ...c, 
          termsAndConditions: [...c.termsAndConditions, '']
        }))}
      >
        + Add term
      </button>
    </div>
  );

  const renderTab = () => {
    const tab = tabs.find(t => t.key === activeTab);
    if (!tab) return null;
    if (tab.type === 'system') return <TabSystem />;
    if (tab.type === 'role') {
      return <TabRoleFeatureModules roleName={(tab as any).roleName} />;
    }
    if (tab.type === 'financial') return <TabFinancial />;
    if (tab.type === 'payment') return <TabPayment />;
    if (tab.type === 'terms') return <TabTerms />;
    return null;
  };

  // Loading state untuk halaman
  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <Header />
        <main className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-6 space-y-6">
          {/* Breadcrumbs shimmer */}
          <div className="flex items-center space-x-2">
            <ShimmerBox className="w-16 h-5" />
            <span className="text-gray-400">/</span>
            <ShimmerBox className="w-20 h-5" />
            <span className="text-gray-400">/</span>
            <ShimmerBox className="w-32 h-5" />
            <span className="text-gray-400">/</span>
            <ShimmerBox className="w-24 h-5" />
            <span className="text-gray-400">/</span>
            <ShimmerBox className="w-16 h-5" />
          </div>
          
          {/* Header shimmer */}
          <div className="flex justify-between items-start">
            <div>
              <ShimmerBox className="w-80 h-9 mb-2" />
              <div className="flex items-center space-x-4">
                <ShimmerBox className="w-24 h-5" />
                <ShimmerBox className="w-32 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShimmerBox className="w-16 h-10" />
              <ShimmerBox className="w-32 h-10" />
            </div>
          </div>

          {/* Tabs shimmer */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {Array.from({ length: 5 }).map((_, i) => (
                <ShimmerBox key={i} className="w-32 h-10" />
              ))}
            </nav>
          </div>

          {/* Content shimmer */}
          <div className="bg-white p-6 rounded-lg">
            <ShimmerForm />
          </div>
        </main>
      </div>
    );
  }

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
            <button onClick={() => router.push(`/projects/${projectId}`)} className="p-2 rounded-md border hover:bg-gray-100">Back</button>
            <button 
              onClick={save} 
              disabled={isSaving}
              className={`font-semibold py-2 px-5 rounded-lg transition-colors ${
                isSaving 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Proposal'
              )}
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                {tab.title}
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
