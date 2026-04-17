import React, { useState, useEffect } from 'react'
import { useMemo } from 'react';
import io from "socket.io-client"
import { toast } from 'react-toastify';
import { useRef } from 'react';

const App = () => {

  const [message, setMessage] = useState([]);
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [popup, setpopup] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const bottomRef = useRef(null);

  const [onlineMembers, setOnlineMembers] = useState([]);
  const socket = useMemo(() => io(import.meta.env.VITE_SERVER_URL, { autoConnect: false, transports: ["websocket"] }), [])
  const [myid, setMyid] = useState("")
  const [hasJoined, setHasJoined] = useState(false)
  const [typing, setTyping] = useState("")

  window.onbeforeunload = (e) => {
    e.preventDefault();
    e.returnValue = "";
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);

  function getCurrentTime() {
    const now = new Date();

    let hours = now.getHours();
    let minutes = now.getMinutes();

    // Add leading zero (e.g. 9 → 09)
    hours = hours.toString().padStart(2, "0");
    minutes = minutes.toString().padStart(2, "0");

    return `${hours}:${minutes}`;
  }

  useEffect(() => {
    socket.on("recived-message", (data) => {
      setMessage((prev) => [...prev, data]);
    });
  }, []);

  useEffect(() => {
    if (!hasJoined) return;

    socket.connect();

    socket.on("connect", () => {
      setMyid(socket.id);
      socket.emit("user-joined", name);
    });

    socket.on("recived-user", (name) => {
      toast.success(`${name} joined the chat`);
    });

    socket.on("update-online-members", (data) => {
      setOnlineMembers(data);
    });

    socket.on("user-left", (name) => {
      toast.error(`${name} left the chat`);
    });

    return () => {
      socket.off("connect");
      socket.off("recived-user");
      socket.off("user-left");
      socket.off("update-online-members");
    };
  }, [hasJoined]);

  const handelMessage = () => {
    socket.emit("send-message", {
      input,
      time: getCurrentTime(),
      id: myid,
      name,
    });

    setInput("");
  };

  const enterChat = () => {
    if (name.trim() !== "") {
      setpopup(true);
      setHasJoined(true);
    }
  };

  const typingTimeout = useRef(null);

  const handleTyping = () => {
    socket.emit("typing", name);

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit("stop-typing");
    }, 1500);
  };

  useEffect(() => {
    socket.on("recived-typing", (name) => {
      setTyping(name);
    });

    socket.on("stop-typing", () => {
      setTyping("");
    });

    return () => {
      socket.off("recived-typing");
      socket.off("stop-typing");
    };
  }, []);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-200">
      {/* Chat Container */}
      {popup ? (
        <div className="w-full max-w-md h-[90vh] bg-white shadow-lg rounded-lg flex flex-col overflow-hidden relative">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-100 border-b">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 text-white w-8 h-8 flex items-center justify-center rounded-full">
                {name && name.length > 0 ? name[0] : ""}
              </div>
              <div>
                <p className="font-semibold text-sm">Group chat</p>
                <p className="text-xs text-gray-500">{typing.length > 0 ? `${typing} is typing...` : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="hidden sm:block text-sm text-gray-600">Signed in as {name}</p>
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                title="Online Members"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Online Members Drawer overlay */}
          {isDrawerOpen && (
            <div
              className="absolute inset-0 bg-black/20 z-10"
              onClick={() => setIsDrawerOpen(false)}
            />
          )}

          {/* Online Members Drawer */}
          <div className={`absolute top-0 right-0 h-full w-64 bg-white shadow-2xl z-20 transform transition-transform duration-300 ease-in-out ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Online Members</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="text-gray-500 hover:text-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="relative">
                    <div className="bg-green-600 text-white w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold">
                      {name && name.length > 0 ? name[0] : ""}
                    </div>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{name} (You)</span>
                </li>

                {onlineMembers.filter(m => m.id !== myid).map(member => (
                  <li key={member.id} className="flex items-center gap-3">
                    <div className="relative">
                      <div className="bg-blue-500 text-white w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold">
                        {member.name && member.name.length > 0 ? member.name[0] : ""}
                      </div>
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{member.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 no-scrollbar">
            {
              message.map((msg, idx) => {
                return (
                  <div key={idx} className={`flex ${msg.id === myid ? "justify-end" : "justify-start"}`}>
                    <div className={`px-4 py-2 rounded-lg max-w-xs shadow ${msg.id === myid ? "bg-green-200" : "bg-gray-200"}`}>
                      <p className="text-sm">{msg.input}</p>
                      <p className="text-xs text-gray-600 mt-1 font-semibold">{msg.name} • {msg.time}</p>
                    </div>
                  </div>
                )
              })
            }
            <div ref={bottomRef}></div>

          </div>

          {/* Input */}
            <div className="p-3 border-t bg-white flex items-center gap-2 no-scrollbar">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              type="text"
              rows={1}
              placeholder="Type a message..."
              
              className="flex-1 px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-400 resize-none no-scrollbar"
              onSelect={handleTyping}
              onKeyDown={(e)=>{
                if(e.key==="Enter" && !e.shiftKey){
                  e.preventDefault();
                  handelMessage();
                }
              }}

            />
            <button className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg" onClick={handelMessage}>
              Send
            </button>
          </div>

        </div>
      ) : (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">

          {/* Popup Box */}
          <div className="bg-white w-70 p-6 rounded-2xl shadow-2xl">

            {/* Title */}
            <h2 className="text-xl font-bold text-center text-gray-800 mb-2">
              Welcome guyzzz
            </h2>

            {/* Description */}
            <p className="text-sm text-gray-500 text-center mb-4">
              Join the realtime chat and start connecting instantly.
            </p>

            {/* ⚠️ Warning */}
            <p className="text-sm text-red-500 text-center mb-5 bg-red-50 border border-red-200 py-2 px-3 rounded-md">
              ⚠️ Please do not refresh the page, otherwise you will be logged out again.
            </p>

            {/* Input */}
            <input
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-400"
            />

            {/* Button */}
            <button
              onClick={enterChat}
              className="mt-5 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition"
            >
              Join Chat
            </button>

          </div>
        </div>
      )}
    </div>
  )
}

export default App


