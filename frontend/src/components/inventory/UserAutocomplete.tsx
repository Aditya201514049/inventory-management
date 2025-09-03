import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchUsers } from '../../services/user';
import { ChevronDown, User } from 'lucide-react';

interface UserAutocompleteProps {
  onSelectUser: (userId: string) => void;
  excludeUserIds?: string[];
  placeholder?: string;
}

interface UserSearchResult {
  id: string;
  name: string;
  email: string;
}

const UserAutocomplete: React.FC<UserAutocompleteProps> = ({
  onSelectUser,
  excludeUserIds = [],
  placeholder = "Search users..."
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search users with debouncing
  const { data: users = [], isLoading } = useQuery<UserSearchResult[]>({
    queryKey: ['users-search', query],
    queryFn: () => searchUsers(query),
    enabled: query.length >= 2,
    staleTime: 30000 // Cache for 30 seconds
  });

  // Filter out excluded users
  const filteredUsers = users.filter(user => !excludeUserIds.includes(user.id));

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length >= 2);
    setSelectedIndex(-1);
  };

  // Handle user selection
  const handleSelectUser = (user: UserSearchResult) => {
    onSelectUser(user.id);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredUsers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredUsers.length) {
          handleSelectUser(filteredUsers[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              Searching users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              {query.length < 2 ? 'Type at least 2 characters to search' : 'No users found'}
            </div>
          ) : (
            filteredUsers.map((user, index) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                  index === selectedIndex ? 'bg-gray-100' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.name || 'No name'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {user.email}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UserAutocomplete;
