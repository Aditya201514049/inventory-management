export interface User {
    id: string
    email: string
    name?: string
    isAdmin: boolean
    blocked: boolean
    createdAt: string
    updatedAt: string
  }
  
  export interface Category {
    id: string
    name: string
  }
  
  export interface Inventory {
    id: string
    title: string
    description?: string
    categoryId?: string
    category?: Category
    imageUrl?: string
    tags: string[]
    ownerId: string
    owner: User
    isPublic: boolean
    version: number
    createdAt: string
    updatedAt: string
  }
  
  export interface Field {
    id: string
    inventoryId: string
    name: string
    type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'TEXT' | 'LINK'
    title: string
    description?: string
    visible: boolean
    order: number
    validation?: any
  }
  
  export interface Item {
    id: string
    inventoryId: string
    userId: string
    user: User
    customId: string
    values: Record<string, any>
    sequence?: number
    version: number
    createdAt: string
    updatedAt: string
  }