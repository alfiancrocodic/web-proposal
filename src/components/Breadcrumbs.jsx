export default function Breadcrumbs({ crumbs = [] }) {
  return (
    <nav className="flex text-sm text-gray-600" aria-label="Breadcrumb">
      <ol className="inline-flex items-center gap-2">
        {crumbs.map((crumb, i) => (
          <li key={i} className="inline-flex items-center gap-2">
            {i > 0 && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            <span className={i === crumbs.length - 1 ? 'text-gray-500' : 'text-blue-600'}>{crumb}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

