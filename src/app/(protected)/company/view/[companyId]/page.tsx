'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/utils/api';
import { URLS } from '@/utils/urls';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

type Company = {
  company_id: string;
  logo?: string;
  proof?: string;
  name: string;
  gst: string;
  email: string;
  phone: string;
  password?: string; // 👈 Added password
  address_1: string;
  country_id: string;
  state_id: string;
  city: string;
  postal_code: string;
  lat: string;
  lng: string;
  subscription_id: string;
  no_of_users: number;
  subscription_startDate: string;
  subscription_endDate: string;
  subscription_amountPerUser: string;
  remarks: string;
  theme_color: string;
  status: boolean;
};

export default function CompanyViewPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.companyId as string | undefined;

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`;
  };

  useEffect(() => {
    if (!companyId) return;
    const fetchCompany = async () => {
      try {
        const res = await api.get(URLS.GET_COMPANY_BY_ID.replace('{id}', companyId));
        setCompany(res.data?.data ?? res.data);
      } catch (err) {
        console.error('Failed to fetch company', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [companyId]);

  if (loading) return <p>Loading company details...</p>;
  if (!company) return <p>Company not found</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Company Details</h1>
        <Button onClick={() => router.push('/company')}>Back</Button>
      </div>

      {/* Company Logo */}
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4">
          {company.logo ? (
            <img
              src={getImageUrl(company.logo)}
              alt="Company Logo"
              className="w-32 h-32 object-contain border rounded-lg"
            />
          ) : (
            <div className="w-32 h-32 flex items-center justify-center text-gray-400 border border-dashed rounded-lg">
              No Logo
            </div>
          )}
          <h2 className="text-xl font-semibold">{company.name}</h2>
          <span
            className={`rounded-full px-4 py-1 text-sm ${
              company.status ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}
          >
            {company.status ? 'Active' : 'Inactive'}
          </span>
        </div>
      </Card>

      {/* Two-column layout */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 text-sm mt-4">
                <p><span className="font-semibold">Email:</span> {company.email}</p>
                <p><span className="font-semibold">Phone:</span> {company.phone}</p>
                <p><span className="font-semibold">GST:</span> {company.gst}</p>
                <p><span className="font-semibold">City:</span> {company.city}</p>
                <p><span className="font-semibold">Postal Code:</span> {company.postal_code}</p>
                <p><span className="font-semibold">Latitude:</span> {company.lat}</p>
                <p><span className="font-semibold">Longitude:</span> {company.lng}</p>
              </div>

              {/* Password */}
              {company.password && (
                <div className="flex items-center gap-2 mt-4">
                  <span className="font-semibold">Password:</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={company.password}
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
              <p className="text-sm mt-2">{company.address_1}</p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Subscription */}
            <div>
              <h3 className="text-lg font-semibold border-b pb-2">Subscription</h3>
              <div className="grid grid-cols-1 gap-3 text-sm mt-4">
                <p><span className="font-semibold">Subscription ID:</span> {company.subscription_id}</p>
                <p><span className="font-semibold">No. of Users:</span> {company.no_of_users}</p>
                <p><span className="font-semibold">Amount Per User:</span> {company.subscription_amountPerUser}</p>
                <p><span className="font-semibold">From:</span> {company.subscription_startDate?.split('T')[0]}</p>
                <p><span className="font-semibold">To:</span> {company.subscription_endDate?.split('T')[0]}</p>
              </div>
            </div>

            {/* Remarks & Theme */}
            <div>
              <h3 className="text-lg font-semibold border-b pb-2">Other Details</h3>
              <p className="text-sm mt-2"><span className="font-semibold">Remarks:</span> {company.remarks || '-'}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="font-semibold">Theme Color:</span>
                <div
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: company.theme_color }}
                />
                <span>{company.theme_color}</span>
              </div>
            </div>
          </div>
        </div>
      
        <h3 className="text-lg font-semibold border-b pb-2">Proof</h3>
        <div className="mt-4">
          {company.proof ? (
            company.proof.endsWith('.pdf') ? (
              <a
                href={getImageUrl(company.proof)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View Proof (PDF)
              </a>
            ) : (
              <img
                src={getImageUrl(company.proof)}
                alt="Proof"
                className="w-40 h-40 object-contain border rounded-lg"
              />
            )
          ) : (
            <p className="text-gray-500 text-sm">No Proof Uploaded</p>
          )}
        </div>
      </Card>
    </div>
  );
}
