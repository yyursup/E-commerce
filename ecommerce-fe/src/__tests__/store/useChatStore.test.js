import { describe, it, expect, beforeEach, vi } from 'vitest'
import toast from 'react-hot-toast'
import { useChatStore } from '../../store/useChatStore'
import { useAuthStore } from '../../store/useAuthStore'

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn() } }))

const initial = useChatStore.getState()
const state = () => useChatStore.getState()
const shop = { id: 'SHOP-1', name: 'Sao Mai', ownerAccountId: 'ACC-9' }
const product = { id: 'P1', name: 'iPhone', price: 1, image: 'x.jpg' }

describe('useChatStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useChatStore.setState(initial, true)
    useAuthStore.setState({ user: null })
  })

  it('starts closed on the inbox in live mode', () => {
    expect(state()).toMatchObject({ isOpen: false, viewMode: 'inbox', chatMode: 'live', activeShop: null, unreadTotal: 0 })
  })

  it('openInbox opens the panel and forgets the previous conversation', () => {
    useChatStore.setState({ activeShop: shop, activeProduct: product, viewMode: 'conversation' })
    state().openInbox()
    expect(state()).toMatchObject({ isOpen: true, viewMode: 'inbox', activeShop: null, activeProduct: null })
  })

  it('openSupportChat opens a live conversation with the platform', () => {
    useChatStore.setState({ chatMode: 'bot' })
    state().openSupportChat()
    expect(state()).toMatchObject({ isOpen: true, viewMode: 'conversation', chatMode: 'live', activeShop: null })
  })

  it('openBotChat opens the AI assistant', () => {
    state().openBotChat()
    expect(state()).toMatchObject({ isOpen: true, viewMode: 'conversation', chatMode: 'bot', activeShop: null })
  })

  describe('openShopChat', () => {
    it('opens a live chat about a product for a guest', () => {
      state().openShopChat(shop, product)
      expect(state()).toMatchObject({ isOpen: true, viewMode: 'conversation', chatMode: 'live', activeShop: shop, activeProduct: product })
    })

    it('opens a chat without a product', () => {
      useAuthStore.setState({ user: { id: 'ACC-1', accountId: 'ACC-1' } })
      state().openShopChat(shop)
      expect(state().activeShop).toBe(shop)
      expect(state().activeProduct).toBeNull()
    })

    it('stops a seller from messaging their own shop (matched by shopId, any case)', () => {
      useAuthStore.setState({ user: { shopId: 'shop-1' } })
      state().openShopChat(shop, product)
      expect(toast.error).toHaveBeenCalledWith('Bạn không thể tự nhắn tin cho chính gian hàng của mình')
      expect(state().isOpen).toBe(false)
    })

    it('stops a seller from messaging their own shop (matched by owner account)', () => {
      useAuthStore.setState({ user: { id: 'acc-9' } })
      state().openShopChat(shop)
      expect(toast.error).toHaveBeenCalledOnce()
      expect(state().activeShop).toBeNull()
    })
  })

  it('backToInbox keeps the panel open but leaves the conversation', () => {
    state().openShopChat(shop, product)
    state().backToInbox()
    expect(state()).toMatchObject({ isOpen: true, viewMode: 'inbox', activeShop: null, activeProduct: null })
  })

  it('closeChat hides the panel but remembers where the user was', () => {
    state().openShopChat(shop)
    state().closeChat()
    expect(state().isOpen).toBe(false)
    expect(state().activeShop).toBe(shop)
  })

  it('clearActiveShop returns to the inbox', () => {
    state().openShopChat(shop, product)
    state().clearActiveShop()
    expect(state()).toMatchObject({ viewMode: 'inbox', activeShop: null, activeProduct: null })
  })

  it('exposes simple setters', () => {
    state().setUnreadTotal(5)
    state().setChatMode('bot')
    state().setViewMode('conversation')
    state().setIsOpen(true)
    expect(state()).toMatchObject({ unreadTotal: 5, chatMode: 'bot', viewMode: 'conversation', isOpen: true })
  })
})
