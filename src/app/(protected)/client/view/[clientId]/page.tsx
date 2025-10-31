'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/utils/api';
import { URLS } from '@/utils/urls';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

type Client = {
  client_id: string;
  company_id: string;
  company_name?: string;
  photo?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  business_typeId: string;
  business_typeName?: string;
  address_1?: string;
  country_id?: number;
  state_id?: string;
  city?: string;
  postal_code?: string;
  lat?: string;
  lng?: string;
  visiting_startTime?: string;
  visiting_endTime?: string;
  available_status?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type Country = { country_id: number; country_name: string };
type State = { state_id: string; state_name: string };
type BusinessType = { business_typeId: string; business_typeName: string };

export default function ClientViewPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.clientId as string | undefined;

  const [client, setClient] = useState<Client | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [loading, setLoading] = useState(true);

  const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [countriesRes, statesRes, businessRes] = await Promise.all([
          api.get(URLS.GET_COUNTRIES),
          api.get(URLS.GET_STATES),
          api.get(URLS.GET_BUSINESS_TYPES),
        ]);
        setCountries(countriesRes.data?.data ?? countriesRes.data);
        setStates(statesRes.data?.data ?? statesRes.data);
        setBusinessTypes(businessRes.data?.data ?? businessRes.data);

        if (clientId) {
          const clientRes = await api.get(URLS.GET_CLIENT_BY_ID.replace('{id}', clientId));
          setClient(clientRes.data?.data ?? clientRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch client data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [clientId]);

  if (loading) return <p>Loading client details...</p>;
  if (!client) return <p>Client not found</p>;

  const countryName = countries.find(c => c.country_id === client.country_id)?.country_name ?? '-';
  const stateName = states.find(s => s.state_id === client.state_id)?.state_name ?? '-';
  const businessTypeName = businessTypes.find(b => b.business_typeId === client.business_typeId)?.business_typeName ?? '-';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Client Details</h1>
        <Button onClick={() => router.push('/clients')}>Back</Button>
      </div>

      {/* Photo & Name */}
      <Card className="p-6 flex flex-col items-center gap-4">
        {client.photo ? (
          <img
            src={getImageUrl(client.photo)}
            alt="Client Photo"
            className="w-32 h-32 object-contain border rounded-lg"
          />
        ) : (
          <div className="w-32 h-32 flex items-center justify-center text-gray-400 border border-dashed rounded-lg">
            No Photo
          </div>
        )}
        <h2 className="text-xl font-semibold">{client.firstName} {client.lastName}</h2>
        <span className={`rounded-full px-4 py-1 text-sm ${client.available_status ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          {client.available_status ? 'Available' : 'Unavailable'}
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
                <p><span className="font-semibold">Email:</span> {client.email}</p>
                <p><span className="font-semibold">Phone:</span> {client.phone}</p>
                <p><span className="font-semibold">Business Type:</span> {businessTypeName}</p>
                <p><span className="font-semibold">Company:</span> {client.company_name || '-'}</p>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-lg font-semibold border-b pb-2">Address</h3>
              <div className="text-sm mt-2 space-y-1">
                <p>{client.address_1 || '-'}</p>
                <p>{client.city || '-'}, {stateName}, {countryName}</p>
                <p>Postal Code: {client.postal_code || '-'}</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Visiting Time */}
            <div>
              <h3 className="text-lg font-semibold border-b pb-2">Visiting Time</h3>
              <div className="text-sm mt-2 space-y-1">
                <p><span className="font-semibold">Start:</span> {client.visiting_startTime || '-'}</p>
                <p><span className="font-semibold">End:</span> {client.visiting_endTime || '-'}</p>
              </div>
            </div>

            {/* Status & Dates */}
            <div>
              <h3 className="text-lg font-semibold border-b pb-2">Other Details</h3>
              <div className="text-sm mt-4 space-y-1">
                <p><span className="font-semibold">Status:</span> {client.available_status ? 'Available' : 'Unavailable'}</p>
                <p><span className="font-semibold">Created At:</span> {new Date(client.createdAt || '').toLocaleString() || '-'}</p>
                <p><span className="font-semibold">Updated At:</span> {new Date(client.updatedAt || '').toLocaleString() || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
