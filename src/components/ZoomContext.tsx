import { createContext, useContext } from 'react'

export const ZoomContext = createContext(1)
export const useZoom = () => useContext(ZoomContext)