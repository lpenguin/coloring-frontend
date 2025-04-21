import create from 'zustand';
import imagesData from '../data/images.json';

export type Tool = 'brush' | 'fill';
export type Image = {
  id: number;
  name: string;
  url: string;
  svgData?: string;
};

export type SavedDrawing = {
  id: number;
  imageId: number;
  imageData: string; // Changed from svgData to imageData for PNG storage
  timestamp: number;
}

interface ColoringState {
  currentColor: string;
  currentTool: Tool;
  images: Image[];
  currentImage: Image | null;
  savedDrawings: SavedDrawing[];
  isLoading: boolean;
  error: string | null;
  
  setColor: (color: string) => void;
  setTool: (tool: Tool) => void;
  fetchImages: () => void;
  fetchImageById: (id: number) => void;
  saveDrawing: (imageData: string) => void; // Changed to accept imageData (PNG data URL)
  fetchSavedDrawings: () => void;
  clearError: () => void;
}

// Key for localStorage
const SAVED_DRAWINGS_KEY = 'coloringApp_savedDrawings';

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
  
  fetchImages: () => {
    set({ isLoading: true, error: null });
    try {
      // Use the local JSON file instead of API calls
      set({ images: imagesData, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load images', isLoading: false });
      console.error('Error fetching images:', error);
    }
  },
  
  fetchImageById: (id) => {
    set({ isLoading: true, error: null });
    try {
      const image = imagesData.find(img => img.id === id);
      if (image) {
        set({ currentImage: image, isLoading: false });
      } else {
        throw new Error('Image not found');
      }
    } catch (error) {
      set({ error: 'Failed to load image', isLoading: false });
      console.error('Error fetching image:', error);
    }
  },
  
  saveDrawing: (imageData) => {
    set({ isLoading: true, error: null });
    try {
      const { currentImage, savedDrawings } = get();
      if (!currentImage) throw new Error('No image selected');
      
      // Create a new saved drawing with PNG data
      const newDrawing: SavedDrawing = {
        id: Date.now(), // Use timestamp as ID
        imageId: currentImage.id,
        imageData, // Store the PNG data URL
        timestamp: Date.now()
      };
      
      // Add to state
      const updatedDrawings = [...savedDrawings, newDrawing];
      set({ savedDrawings: updatedDrawings, isLoading: false });
      
      // Save to localStorage
      localStorage.setItem(SAVED_DRAWINGS_KEY, JSON.stringify(updatedDrawings));
    } catch (error) {
      set({ error: 'Failed to save drawing', isLoading: false });
      console.error('Error saving drawing:', error);
    }
  },
  
  fetchSavedDrawings: () => {
    set({ isLoading: true, error: null });
    try {
      // Load from localStorage
      const savedData = localStorage.getItem(SAVED_DRAWINGS_KEY);
      const savedDrawings = savedData ? JSON.parse(savedData) : [];
      set({ savedDrawings, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load saved drawings', isLoading: false });
      console.error('Error fetching saved drawings:', error);
    }
  },
  
  clearError: () => set({ error: null })
}));
