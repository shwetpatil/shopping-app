import { SearchBar } from '../components/search-bar';
import { FilterPanel } from '../components/filter-panel';

export default function SearchMFEPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Search MFE - Standalone Mode</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">SearchBar Component</h2>
        <SearchBar />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">FilterPanel Component (Open State)</h2>
        <div className="relative">
          <FilterPanel isOpen={true} onClose={() => {}} />
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-bold mb-2">🎯 Module Info</h3>
        <ul className="text-sm space-y-1">
          <li>✅ Port: 3001</li>
          <li>✅ Exposed: SearchBar, FilterPanel</li>
          <li>✅ Team: Search Team</li>
          <li>✅ Deployable: Independently</li>
        </ul>
      </div>
    </div>
  );
}
