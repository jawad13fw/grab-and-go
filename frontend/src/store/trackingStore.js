import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useTrackingStore = create(
  devtools((set) => ({
    riderLocations: {},
    setRiderLocation: (riderId, location) =>
      set((state) => ({
        riderLocations: { ...state.riderLocations, [riderId]: location },
      })),
  }))
);

export default useTrackingStore;

