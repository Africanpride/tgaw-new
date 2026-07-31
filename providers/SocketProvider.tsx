"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { getSocket } from "@/lib/socket/client"
import type { Socket } from "socket.io-client"

interface SocketContextValue {
  socket: Socket | null
  connected: boolean
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
})

export function useSocket() {
  return useContext(SocketContext)
}

let sharedSocket: Socket | null = null

function getSharedSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = getSocket()
  }
  return sharedSocket
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false)
  const [socket] = useState<Socket>(() => getSharedSocket())

  useEffect(() => {
    const s = socket

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    s.on("connect", onConnect)
    s.on("disconnect", onDisconnect)

    if (!s.connected) {
      s.connect()
    }

    return () => {
      s.off("connect", onConnect)
      s.off("disconnect", onDisconnect)
      s.disconnect()
      sharedSocket = null
    }
  }, [socket])

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  )
}
