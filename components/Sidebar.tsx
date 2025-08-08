import { useState } from 'react'
import { useSocket } from '../context/SocketContext'

interface Contact {
  address: string
  lastMessage?: string
  timestamp?: Date
  unreadCount?: number
}

interface SidebarProps {
  contacts: Contact[]
  selectedContact: string | null
  onSelectContact: (address: string) => void
  onAddContact: (address: string) => void
  onDisconnect: () => void
  currentUser: string
}

export default function Sidebar({
  contacts,
  selectedContact,
  onSelectContact,
  onAddContact,
  onDisconnect,
  currentUser
}: SidebarProps) {
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContactAddress, setNewContactAddress] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const { onlineUsers } = useSocket()

  const handleAddContact = () => {
    const trimmedAddress = newContactAddress.trim()
    if (trimmedAddress && trimmedAddress !== currentUser) {
      onAddContact(trimmedAddress)
      setNewContactAddress('')
      setShowAddContact(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTime = (timestamp?: Date) => {
    if (!timestamp) return ''
    const now = new Date()
    const diff = now.getTime() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const filteredContacts = contacts.filter(contact =>
    formatAddress(contact.address).toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-full md:w-96 bg-transparent p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Contact</h1>
        <button 
          onClick={() => setShowAddContact(true)} 
          className="text-text-secondary hover:text-accent-blue transition-colors p-2 rounded-lg hover:bg-white/50"
          title="Add Contact"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white rounded-xl p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 shadow-soft"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-2xl shadow-soft flex-1 p-4 overflow-y-auto scrollbar-thin">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-lg font-medium">No contacts yet</p>
            <p className="text-sm">Add a contact to start chatting</p>
          </div>
        ) : (
          filteredContacts.map(contact => (
            <div
              key={contact.address}
              onClick={() => onSelectContact(contact.address)}
              className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                selectedContact === contact.address 
                  ? 'bg-brand-purple shadow-sm' 
                  : 'hover:bg-gray-50 hover:shadow-sm'
              }`}
            >
              <div className="relative mr-4">
                <img 
                  className="w-12 h-12 rounded-full shadow-sm" 
                  src={`https://i.pravatar.cc/150?u=${contact.address}`} 
                  alt={contact.address} 
                />
                {onlineUsers.includes(contact.address) && (
                  <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-online-green border-2 border-white shadow-sm animate-pulse"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h2 className="font-semibold text-text-primary truncate">{formatAddress(contact.address)}</h2>
                  <p className="text-xs text-text-secondary flex-shrink-0 ml-2">{formatTime(contact.timestamp)}</p>
                </div>
                <p className="text-sm text-text-secondary truncate">
                  {contact.lastMessage || 'No messages yet'}
                </p>
                {contact.unreadCount && contact.unreadCount > 0 && (
                  <div className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-accent-blue rounded-full mt-1">
                    {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* User Info and Sign Out */}
      <div className="mt-4 bg-white rounded-2xl shadow-soft p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-blue to-purple-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-white">
                {currentUser.slice(2, 4).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {formatAddress(currentUser)}
              </p>
              <p className="text-xs text-online-green">Online</p>
            </div>
          </div>
          <button
            onClick={onDisconnect}
            className="group p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
            title="Sign Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
      {showAddContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Contact</h3>
            <input
              type="text"
              placeholder="Enter wallet address (0x...)"
              value={newContactAddress}
              onChange={(e) => setNewContactAddress(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
            <div className="flex justify-end space-x-4">
              <button onClick={() => setShowAddContact(false)} className="text-text-secondary">Cancel</button>
              <button onClick={handleAddContact} className="bg-accent-blue text-white px-4 py-2 rounded-xl">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
