import { useProfile } from '@/hooks/useProfile';
import { useEffect, useState } from 'react';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.1.65:3000';

export type ShopStatus = 'idle' | 'pending' | 'activated';

export const useOpenShop = () => {
  const { theme, profileData, ringColor, blobColor, user } = useProfile();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isValidatingZip, setIsValidatingZip] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [shopStatus, setShopStatus] = useState<ShopStatus>('idle');
  const [shopData, setShopData] = useState<null | {
    shopName: string;
    submittedAt: string;
    activatedAt?: string;
    city: string;
    selectedCategories: string[];
    phone: string;
  }>(null);

  const [formData, setFormData] = useState({
    shopName: '',
    phone: '',
    zipCode: '',
    city: '',
    selectedCategories: [] as string[],
    termsAccepted: false,
  });

  const isPhoneValid = /^(09|\+639)\d{9}$/.test(formData.phone);

  // Check application status on mount
  useEffect(() => {
    const checkStatus = async () => {
      const email = user?.email;
      if (!email) {
        setCheckingStatus(false);
        return;
      }
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/merchant-application/status?email=${encodeURIComponent(email)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.hasPending) {
            const app = data.application;
            if (app.status === 'activated') {
              setShopStatus('activated');
            } else {
              setShopStatus('pending');
            }
            setShopData({
              shopName: app.shopName,
              submittedAt: app.submittedAt,
              activatedAt: app.activatedAt,
              city: app.city,
              selectedCategories: app.selectedCategories || [],
              phone: app.phone,
            });
          } else {
            setShopStatus('idle');
          }
        }
      } catch (e) {
        console.log('Could not check shop status:', e);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkStatus();
  }, [user?.email]);

  // Auto-fetch city from ZIP code
  useEffect(() => {
    const fetchCity = async () => {
      if (formData.zipCode.length === 4) {
        setIsValidatingZip(true);
        try {
          const response = await fetch(`https://api.zippopotam.us/ph/${formData.zipCode}`);
          if (response.ok) {
            const data = await response.json();
            const cleanCity = data.places[0]['place name'].split(',')[0].trim();
            setFormData(prev => ({ ...prev, city: cleanCity }));
          } else {
            setFormData(prev => ({ ...prev, city: 'Not found' }));
          }
        } catch (e) {
          setFormData(prev => ({ ...prev, city: 'Error' }));
        } finally {
          setIsValidatingZip(false);
        }
      } else if (formData.zipCode.length < 4) {
        setFormData(prev => ({ ...prev, city: '' }));
      }
    };
    fetchCity();
  }, [formData.zipCode]);

  const toggleCategory = (cat: string) => {
    setFormData(prev => {
      const exists = prev.selectedCategories.includes(cat);
      if (exists) return { ...prev, selectedCategories: prev.selectedCategories.filter(c => c !== cat) };
      if (prev.selectedCategories.length < 3) return { ...prev, selectedCategories: [...prev.selectedCategories, cat] };
      return prev;
    });
  };

  const isFormValid =
    formData.shopName.trim().length >= 3 &&
    isPhoneValid &&
    formData.zipCode.length === 4 &&
    formData.city.length > 0 &&
    formData.city !== 'Not found' &&
    formData.city !== 'Error' &&
    formData.selectedCategories.length > 0 &&
    formData.termsAccepted;

  const handleSubmit = async () => {
    if (!isFormValid || loading) return;
    setLoading(true);
    try {
      const email = user?.email;
      if (!email) throw new Error('No email found. Please log in again.');

      const response = await fetch(`${BACKEND_URL}/api/merchant-application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShopStatus('pending');
        setShopData({
          shopName: formData.shopName,
          submittedAt: new Date().toISOString(),
          city: formData.city,
          selectedCategories: formData.selectedCategories,
          phone: formData.phone,
        });
        setSuccessVisible(true);
      } else if (response.status === 400 && data.message?.toLowerCase().includes('pending')) {
        setShopStatus('pending');
      } else {
        throw new Error(data.message || 'Server returned an error');
      }
    } catch (error: any) {
      alert(`Submission failed: ${error.message || 'Check your connection and try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    theme,
    ringColor,
    blobColor,
    formData,
    setFormData,
    loading,
    checkingStatus,
    isValidatingZip,
    successVisible,
    setSuccessVisible,
    showTerms,
    setShowTerms,
    isPhoneValid,
    isFormValid,
    toggleCategory,
    handleSubmit,
    shopStatus,
    shopData,
  };
};