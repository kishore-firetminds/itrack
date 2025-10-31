'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/utils/api';
import { URLS } from '@/utils/urls';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

type User = {
  user_id: string;
  company_id: string;
  company_name?: string;
  photo?: string;
  name: string;
  email: string;
  phone: string;
  emergency_contact?: string;
  password?: string;
  address_1?: string;
  country_id?: number;
  state_id?: string;
  city?: string;
  postal_code?: string;
  role_id?: string;
  role_name?: string;
  supervisor_id?: string;
  supervisor_name?: string;
  vendor_id?: string;
  vendor_name?: string;
  region_id?: string;
  region_name?: string;
  shift_id?: string;
  shift_name?: string;
  proof?: string;
  status?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type Country = { country_id: number; country_name: string };
type State = { state_id: string; state_name: string };

export default function UserViewPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string | undefined;

  const [user, setUser] = useState<User | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
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
        // Fetch countries and states
        const [countriesRes, statesRes] = await Promise.all([
          api.get(URLS.GET_COUNTRIES),
          api.get(URLS.GET_STATES),
        ]);
        setCountries(countriesRes.data?.data ?? countriesRes.data);
        setStates(statesRes.data?.data ?? statesRes.data);

        // Fetch user
        if (userId) {
          const userRes = await api.get(URLS.GET_USER_BY_ID.replace('{id}', userId));
          setUser(userRes.data?.data ?? userRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (loading) return <p>Loading user details...</p>;
  if (!user) return <p>User not found</p>;

  const countryName = countries.find(c => c.country_id === user.country_id)?.country_name ?? '-';
  const stateName = states.find(s => s.state_id === user.state_id)?.state_name ?? '-';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">User Details</h1>
        <Button onClick={() => router.push('/user')}>Back</Button>
      </div>

      {/* Photo & Name */}
      <Card className="p-6 flex flex-col items-center gap-4">
        {user.photo ? (
          <img
            src={getImageUrl(user.photo)}
            alt="User Photo"
            className="w-32 h-32 object-contain border rounded-lg"
          />
        ) : (
          <div className="w-32 h-32 flex items-center justify-center text-gray-400 border border-dashed rounded-lg">
            No Photo
          </div>
        )}
        <h2 className="text-xl font-semibold">{user.name}</h2>
        <span className={`rounded-full px-4 py-1 text-sm ${user.status ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          {user.status ? 'Active' : 'Inactive'}
        </span>
      </Card>

      {/* Two-column layout */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 gap-3 text-sm mt-4">
                <p><span className="font-semibold">Email:</span> {user.email}</p>
                <p><span className="font-semibold">Phone:</span> {user.phone}</p>
                <p><span className="font-semibold">Emergency Contact:</span> {user.emergency_contact || '-'}</p>
                <p><span className="font-semibold">Company:</span> {user.company_name || '-'}</p>
                <p><span className="font-semibold">Role:</span> {user.role_name || '-'}</p>
                <p><span className="font-semibold">Supervisor:</span> {user.supervisor_name || '-'}</p>
                <p><span className="font-semibold">Vendor:</span> {user.vendor_name || '-'}</p>
                <p><span className="font-semibold">Region:</span> {user.region_name || '-'}</p>
                <p><span className="font-semibold">Shift:</span> {user.shift_name || '-'}</p>
              </div>

              {/* Password */}
              {user.password && (
                <div className="flex items-center gap-2 mt-4">
                  <span className="font-semibold">Password:</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={user.password}
                    readOnly
                    className="border px-2 py-1 rounded w-64"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              )}
            </div>

            {/* Address */}
            <div>
              <h3 className="text-lg font-semibold border-b pb-2">Address</h3>
              <div className="text-sm mt-2 space-y-1">
                <p>{user.address_1 || '-'}</p>
                <p>{user.city || '-'}, {stateName}, {countryName}</p>
                <p>Postal Code: {user.postal_code || '-'}</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* KYC / Proof */}
            {user.proof && (
              <div>
                <h3 className="text-lg font-semibold border-b pb-2">KYC / Proof</h3>
                <div className="mt-4">
                  {user.proof.endsWith('.pdf') ? (
                    <a href={getImageUrl(user.proof)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View PDF</a>
                  ) : (
                    <img src={getImageUrl(user.proof)} alt="Proof" className="w-32 h-32 object-contain border rounded-lg" />
                  )}
                </div>
              </div>
            )}

            {/* Status & Dates */}
            <div>
              <h3 className="text-lg font-semibold border-b pb-2">Other Details</h3>
              <div className="text-sm mt-4 space-y-1">
                <p><span className="font-semibold">Status:</span> {user.status ? 'Active' : 'Inactive'}</p>
                <p><span className="font-semibold">Created At:</span> {new Date(user.createdAt || '').toLocaleString() || '-'}</p>
                <p><span className="font-semibold">Updated At:</span> {new Date(user.updatedAt || '').toLocaleString() || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
