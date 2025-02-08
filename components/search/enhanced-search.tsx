import React, { useState } from 'react';

interface EnhancedSearchProps {
  onSearch: (query: string) => void;
}

const EnhancedSearch: React.FC<EnhancedSearchProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    onSearch(query);
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <button onClick={handleSearch}>Search</button>
    </div>
  );
};

export default EnhancedSearch;