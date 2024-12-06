export function SearchBar({ onSearch }: { onSearch: (query: string) => void; }) {
  return (
    <div className="mb-6">
      <input
        type="text"
        placeholder="Search..."
        className="w-full p-2 border rounded-lg"
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
}