import { create } from 'zustand'

export const useChatStore = create((set) => ({
  isOpen: false,
  viewMode: 'inbox', // 'inbox' | 'conversation'
  activeShop: null, // { id, name, logo, city, mallBadge, ekycVerified }
  activeProduct: null, // { id, name, price, image }
  chatMode: 'live', // 'bot' | 'live'
  unreadTotal: 0,

  setUnreadTotal: (unreadTotal) => set({ unreadTotal }),

  openInbox: () => {
    set({
      isOpen: true,
      viewMode: 'inbox',
      activeShop: null,
      activeProduct: null,
    })
  },

  openSupportChat: () => {
    set({
      isOpen: true,
      viewMode: 'conversation',
      activeShop: null,
      activeProduct: null,
      chatMode: 'live',
    })
  },

  openBotChat: () => {
    set({
      isOpen: true,
      viewMode: 'conversation',
      activeShop: null,
      activeProduct: null,
      chatMode: 'bot',
    })
  },

  openShopChat: (shop, product = null) => {
    set({
      isOpen: true,
      viewMode: 'conversation',
      activeShop: shop,
      activeProduct: product,
      chatMode: 'live',
    })
  },

  backToInbox: () => {
    set({
      viewMode: 'inbox',
      activeShop: null,
      activeProduct: null,
    })
  },

  closeChat: () => {
    set({ isOpen: false })
  },

  clearActiveShop: () => {
    set({ activeShop: null, activeProduct: null, viewMode: 'inbox' })
  },

  setChatMode: (mode) => {
    set({ chatMode: mode })
  },

  setViewMode: (viewMode) => {
    set({ viewMode })
  },

  setIsOpen: (isOpen) => {
    set({ isOpen })
  },
}))

export default useChatStore
