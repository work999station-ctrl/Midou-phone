import { create } from 'zustand';

const initialBookingData = {
  deviceType: '', // 'phone' or 'tablet'
  brand: '',      // e.g. 'Apple', 'Samsung'
  model: '',      // e.g. 'iPhone 14'
  issue: '',      // e.g. 'cracked screen'
  customerName: '',
  customerPhone: '',
  notes: '',
  estimatedPrice: 0
};

export const useRepairStore = create((set) => ({
  step: 1,
  bookingData: { ...initialBookingData },

  setBookingData: (data) => set((state) => ({
    bookingData: {
      ...state.bookingData,
      ...data
    }
  })),

  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
  setStep: (stepNum) => set({ step: stepNum }),

  resetBooking: () => set({
    step: 1,
    bookingData: { ...initialBookingData }
  })
}));
