import React from 'react'
import FriendList from '../components/FriendList'
import ChatWindow from '../components/ChatWindow'
import SideBar from '../components/SideBar'

const ChatPage = () => {
  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div className="w-[72px] flex-shrink-0">
        <SideBar />
      </div>

      {/* Friend List */}
      <div className="w-[320px] flex-shrink-0">
        <FriendList />
      </div>

      {/* Chat Window */}
      <div className="flex-1">
        <ChatWindow />
      </div>
    </div>
  )
}

export default ChatPage
