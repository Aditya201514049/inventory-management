
export interface Field {
    id: string;
    inventoryId: string;
    name: string;
    type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'TEXT' | 'LINK';
    title: string;
    description?: string;
    visible: boolean;
    order: number;
    validation?: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      regex?: string;
      minValue?: number;
      maxValue?: number;
      options?: string[];
    };
    createdAt: string;
    updatedAt: string;
  }
  
  export interface CreateFieldInput {
    name: string;
    type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'TEXT' | 'LINK';
    title: string;
    description?: string;
    visible: boolean;
    validation?: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      regex?: string;
      minValue?: number;
      maxValue?: number;
      options?: string[];
    };
    order: number;
  }
  
  export interface UpdateFieldInput {
    name?: string;
    type?: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'TEXT' | 'LINK';
    title?: string;
    description?: string;
    visible?: boolean;
    validation?: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      regex?: string;
      minValue?: number;
      maxValue?: number;
      options?: string[];
    };
    order?: number;
  }