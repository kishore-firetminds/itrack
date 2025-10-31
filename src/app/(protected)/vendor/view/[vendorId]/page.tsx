'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/utils/api';
import { URLS } from '@/utils/urls';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

type Vendor = {
  vendor_id: string;
  vendor_name: string;
  photo?: string;
  email: string;
  phone: string;
  password?: string;
  country_id?: number;
  state_id?: string;      // UUID
  district_id?: string;   // UUID
  city?: string;
  postal_code?: string;
  address_1?: string;
  company_name?: string;
  role_name?: string;
  region_name?: string;
  status: boolean;
};

type Country = {
  country_id: number;
  country_name: string;
};

type State = {
  state_id: string;       // UUID
  state_name: string;
};

type District = {
  district_id: string;    // UUID
  district_name: string;
};

export default function VendorViewPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params?.vendorId as string | undefined;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch countries, states, and districts
        const [countriesRes, statesRes, districtsRes] = await Promise.all([
          api.get(URLS.GET_COUNTRIES),
          api.get(URLS.GET_STATES),
          api.get(URLS.GET_DISTRICTS),
        ]);
        setCountries(countriesRes.data?.data ?? countriesRes.data);
        setStates(statesRes.data?.data ?? statesRes.data);
        setDistricts(districtsRes.data?.data ?? districtsRes.data);

        // Fetch vendor
        if (vendorId) {
          const vendorRes = await api.get(URLS.GET_VENDOR_BY_ID.replace('{id}', vendorId));
          setVendor(vendorRes.data?.data ?? vendorRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [vendorId]);

  if (loading) return <p>Loading vendor details...</p>;
  if (!vendor) return <p>Vendor not found</p>;

  const countryName = countries.find(c => c.country_id === vendor.country_id)?.country_name ?? '-';
  const stateName = states.find(s => s.state_id === vendor.state_id)?.state_name ?? '-';
  const districtName = districts.find(d => d.district_id === vendor.district_id)?.district_name ?? '-';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Vendor Details</h1>
        <Button onClick={() => router.push('/vendor')}>Back</Button>
      </div>

      {/* Vendor Photo & Name */}
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4">
          {vendor.photo ? (
            <img
              src={getImageUrl(vendor.photo)}
              alt="Vendor Photo"
              className="w-32 h-32 object-contain border rounded-lg"
            />
          ) : (
            <div className="w-32 h-32 flex items-center justify-center text-gray-400 border border-dashed rounded-lg">
              No Photo
            </div>
          )}
          <h2 className="text-xl font-semibold">{vendor.vendor_name}</h2>
          <span
            className={`rounded-full px-4 py-1 text-sm ${vendor.status ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
          >
            {vendor.status ? 'Active' : 'Inactive'}
          </span>
        </div>
      </Card>

      {/* Two-column layout */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 gap-3 text-sm mt-4">
                <p><span className="font-semibold">Email:</span> {vendor.email}</p>
                <p><span className="font-semibold">Phone:</span> {vendor.phone}</p>
                <p><span className="font-semibold">Company:</span> {vendor.company_name || '-'}</p>
                <p><span className="font-semibold">Role:</span> {vendor.role_name || '-'}</p>
                <p><span className="font-semibold">Region:</span> {vendor.region_name || '-'}</p>
              </div>

              {/* Password */}
              {vendor.password && (
                <div className="flex items-center gap-2 mt-4">
                  <span className="font-semibold">Password:</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={vendor.password}
                    readOnly
                    className="border px-2 py-1 rounded w-64"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              )}
            </div>

            {/* Address */}
            <div>
              <h3 className="text-lg font-semibold border-b pb-2">Address</h3>
              <div className="text-sm mt-2 space-y-1">
                <p>{vendor.address_1 || '-'}</p>
                <p>
                  {vendor.city || '-'}, {districtName}, {stateName}, {countryName}
                </p>
                <p>Postal Code: {vendor.postal_code || '-'}</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Extra Details */}
            <div>
              <h3 className="text-lg font-semibold border-b pb-2">Other Details</h3>
              <div className="text-sm mt-4">
                <p><span className="font-semibold">Status:</span> {vendor.status ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
