"use client";
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';

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
    fetch(`/api/proposals/${pid}/content`).then(r=>r.json()).then((d)=> setContent({ ...DEFAULT_CONTENT, ...d }));
  }, [router, projectId, pid]);

  const save = async () => {
    await fetch(`/api/proposals/${pid}/content`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(content) });
    router.push(`/projects/${projectId}`);
  };

  const addGroup = (key) => setContent(c => ({ ...c, [key]: [...c[key], { group: 'New Group', items: [] }] }));
  const addItem = (key, gi) => setContent(c => ({ ...c, [key]: c[key].map((g,i)=> i!==gi? g: { ...g, items: [...g.items, { name: 'New Feature', condition: '' }]}) }));
  const removeItem = (key, gi, ii) => setContent(c => ({ ...c, [key]: c[key].map((g,i)=> i!==gi? g: { ...g, items: g.items.filter((_,j)=>j!==ii) }) }));

  const addSection = () => setContent(c => ({ ...c, financialBreakdown: [...c.financialBreakdown, { section: 'New Section', items: [] }] }));
  const addFbItem = (si) => setContent(c => ({ ...c, financialBreakdown: c.financialBreakdown.map((s,i)=> i!==si? s: { ...s, items: [...s.items, { activity: 'Activity', resource: 'Resource', quantity: 1, mandays: 0, price: 0, parallel: false, hide: false }]}) }));
  const currency = (n) => new Intl.NumberFormat('id-ID').format(+n||0);

  const TabSystem = () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-700 mb-2">Platforms</p>
        <div className="flex flex-wrap gap-2">
          {['Android Phone', 'Android Tablet', 'iOS iPhone', 'iOS iPad', 'Web Backend', 'Web Frontend'].map(p => (
            <button type="button" key={p} onClick={()=> setContent(c=> ({...c, systemEnvironment: { ...c.systemEnvironment, platforms: c.systemEnvironment.platforms.includes(p) ? c.systemEnvironment.platforms.filter(x=>x!==p) : [...c.systemEnvironment.platforms, p] }}))}
              className={`px-3 py-1 text-sm rounded-full border ${content.systemEnvironment.platforms.includes(p) ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-300 hover:bg-gray-50'}`}>{p}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-700 mb-2">Notes</p>
        <textarea value={content.systemEnvironment.notes} onChange={e=> setContent(c=> ({...c, systemEnvironment: { ...c.systemEnvironment, notes: e.target.value }}))} className="w-full border border-gray-300 rounded p-2" rows={4} />
      </div>
    </div>
  );

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
              <>
                <div className="col-span-5"><input value={it.name} onChange={e=> setContent(c=> ({...c, [keyName]: c[keyName].map((x,i)=> i!==gi?x:{...x, items: x.items.map((y,j)=> j!==ii?y:{...y, name:e.target.value})})}))} className="w-full border border-gray-300 rounded p-2" /></div>
                <div className="col-span-6"><textarea value={it.condition||''} onChange={e=> setContent(c=> ({...c, [keyName]: c[keyName].map((x,i)=> i!==gi?x:{...x, items: x.items.map((y,j)=> j!==ii?y:{...y, condition:e.target.value})})}))} className="w-full border border-gray-300 rounded p-2" rows={2} /></div>
                <div className="col-span-1 flex items-center justify-end"><button onClick={()=>removeItem(keyName, gi, ii)} className="text-gray-500">✕</button></div>
              </>
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
              <>
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
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const TabPayment = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-12 gap-4 text-sm font-semibold">
        <div className="col-span-2">Percentage (%)</div>
        <div className="col-span-8">Description</div>
        <div className="col-span-2 text-right">Total</div>
      </div>
      {content.termsOfPayment.map((t, i) => (
        <div key={i} className="grid grid-cols-12 gap-4 items-center">
          <button className="text-red-500" onClick={()=> setContent(c=> ({...c, termsOfPayment: c.termsOfPayment.filter((_,idx)=>idx!==i)}))}>✕</button>
          <div className="col-span-1"><input type="number" value={t.percentage} onChange={e=> setContent(c=> ({...c, termsOfPayment: c.termsOfPayment.map((x,idx)=> idx!==i? x : { ...x, percentage: +e.target.value })}))} className="w-full bg-gray-50 border rounded-lg p-2" /></div>
          <div className="col-span-8"><input value={t.description} onChange={e=> setContent(c=> ({...c, termsOfPayment: c.termsOfPayment.map((x,idx)=> idx!==i? x : { ...x, description: e.target.value })}))} className="w-full bg-gray-50 border rounded-lg p-2" /></div>
          <div className="col-span-2"><input type="number" value={t.total} onChange={e=> setContent(c=> ({...c, termsOfPayment: c.termsOfPayment.map((x,idx)=> idx!==i? x : { ...x, total: +e.target.value })}))} className="w-full bg-gray-50 border rounded-lg p-2 text-right" /></div>
        </div>
      ))}
      <div className="grid grid-cols-12 gap-4 items-center">
        <button className="text-blue-500" onClick={()=> setContent(c=> ({...c, termsOfPayment: [...c.termsOfPayment, { percentage: 0, description: '', total: 0 }]}))}>+ Add</button>
      </div>
    </div>
  );

  const TabTerms = () => (
    <div className="space-y-3">
      {content.termsAndConditions.map((t, i) => (
        <div key={i} className="flex items-start gap-2">
          <button className="text-red-500" onClick={()=> setContent(c=> ({...c, termsAndConditions: c.termsAndConditions.filter((_,idx)=>idx!==i)}))}>✕</button>
          <textarea value={t} onChange={e=> setContent(c=> ({...c, termsAndConditions: c.termsAndConditions.map((x,idx)=> idx!==i? x : e.target.value)}))} className="w-full bg-gray-50 border rounded-lg p-2" rows={2} />
        </div>
      ))}
      <button className="text-blue-600" onClick={()=> setContent(c=> ({...c, termsAndConditions: [...c.termsAndConditions, '']}))}>+ Add Term</button>
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 1: return <TabSystem />;
      case 2: return <TabFeatures keyName="featureSales"/>;
      case 3: return <TabFeatures keyName="featureAdmin"/>;
      case 4: return <TabFinancial />;
      case 5: return <TabPayment />;
      case 6: return <TabTerms />;
      default: return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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

        <div className="bg-gray-50 p-6 rounded-lg">
          {renderTab()}
        </div>
      </main>
    </div>
  );
}

