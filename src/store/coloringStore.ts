import create from 'zustand';
import axios from 'axios';

export type Tool = 'brush' | 'fill';
export type Image = {
  id: number;
  name: string;
  url: string;
  svgData?: string;
};

interface ColoringState {
  currentColor: string;
  currentTool: Tool;
  images: Image[];
  currentImage: Image | null;
  savedDrawings: any[];
  isLoading: boolean;
  error: string | null;
  
  setColor: (color: string) => void;
  setTool: (tool: Tool) => void;
  fetchImages: () => Promise<void>;
  fetchImageById: (id: number) => Promise<void>;
  saveDrawing: (svgData: string) => Promise<void>;
  fetchSavedDrawings: () => Promise<void>;
  clearError: () => void;
}

const API_BASE_URL = 'http://localhost:3001/api';

export const useColoringStore = create<ColoringState>((set, get) => ({
  currentColor: '#FF0000',
  currentTool: 'brush',
  images: [],
  currentImage: null,
  savedDrawings: [],
  isLoading: false,
  error: null,
  
  setColor: (color) => set({ currentColor: color }),
  setTool: (tool) => set({ currentTool: tool }),
  
  fetchImages: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/images`);
      set({ images: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load images', isLoading: false });
      console.error('Error fetching images:', error);
    }
  },
  
  fetchImageById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/images/${id}`);
      set({ currentImage: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load image', isLoading: false });
      console.error('Error fetching image:', error);
    }
  },
  
  saveDrawing: async (svgData) => {
    set({ isLoading: true, error: null });
    try {
      const { currentImage } = get();
      if (!currentImage) throw new Error('No image selected');
      
      await axios.post(`${API_BASE_URL}/save`, {
        imageId: currentImage.id,
        svgData
      });
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to save drawing', isLoading: false });
      console.error('Error saving drawing:', error);
    }
  },
  
  fetchSavedDrawings: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/saved`);
      set({ savedDrawings: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load saved drawings', isLoading: false });
      console.error('Error fetching saved drawings:', error);
    }
  },
  
  clearError: () => set({ error: null })
}));
