'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { URLS } from '@/utils/urls';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input'; // ✅ Added Input import
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Trash, Search } from 'lucide-react';
import { CustomPagination } from '@/app/components/Pagination';

type VendorRow = {
  vendor_id: string;
  vendor_name: string;
  phone: string;
  role_id: string;
  region: string;
};

type PaginatedVendors = {
  data: VendorRow[];
  page: number;
  limit: number;
  total: number;
};

type Role = {
  role_id: string;
  role_name: string;
};

const PAGE_SIZE = 10;

export default function VendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [roles, setRoles] = useState<Record<string, string>>({}); 
  const [searchText, setSearchText] = useState('');

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedVendors>(URLS.GET_VENDORS, {
        params: { page: currentPage, limit: PAGE_SIZE },
      });
      setVendors(res.data?.data ?? []);
      setTotal(Number(res.data?.total ?? 0));
    } catch (err) {
      console.error('Failed to fetch vendors', err);
      setVendors([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await api.get(URLS.GET_ROLES);
      const map: Record<string, string> = {};
      (res.data.data || []).forEach((r: Role) => {
        map[r.role_id] = r.role_name;
      });
      setRoles(map);
    } catch (err) {
      console.error('Failed to fetch roles', err);
      setRoles({});
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    try {
      await api.delete(`${URLS.DELETE_VENDOR.replace('{id}', id)}`);
      fetchVendors();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  // Client-side filtering
  const filteredVendors = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return vendors.filter(v =>
      !text ||
      v.vendor_name.toLowerCase().includes(text) ||
      v.phone.includes(text) ||
      (roles[v.role_id]?.toLowerCase() || '').includes(text) ||
      (v.region || '').toLowerCase().includes(text)
    );
  }, [vendors, searchText, roles]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Vendors</h1>
        <Button
          className="rounded-3xl"
          onClick={() => router.push('/vendor/create')}
        >
          Create
        </Button>
      </div>

      <Card className="gap-0">
        {/* Search Filter */}
        <div className="flex flex-wrap gap-2  items-center p-4 rounded-t-xl justify-end">
          <div className="flex items-center gap-2 border rounded-full px-3 py-1">
            <Search size={18} />
            <Input
              className="h-8 w-44 border-0 bg-transparent focus-visible:ring-0"
              placeholder="Search by name/phone/role/region"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setCurrentPage(1)} className="rounded-full">Filter</Button>
            <Button variant="outline" onClick={() => { setSearchText(''); setCurrentPage(1); }}  className="rounded-full">Clear</Button>
          </div>
        </div>

        <div className="w-full overflow-x-auto  pb-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="text-center font-bold text-gray-800 ">S.No</TableHead>
                <TableHead className="font-bold text-gray-800">Name</TableHead>
                <TableHead className="font-bold text-gray-800">Phone</TableHead>
                <TableHead className="font-bold text-gray-800">Role</TableHead>
                <TableHead className="font-bold text-gray-800">Region</TableHead>
                <TableHead className="text-center font-bold text-gray-800">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">Loading...</TableCell>
                </TableRow>
              )}
              {!loading && filteredVendors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                    No results found
                  </TableCell>
                </TableRow>
              )}
              {!loading && filteredVendors.map((v, idx) => (
                <TableRow key={v.vendor_id}  className={`${ idx % 2 === 0 ? 'bg-white' : 'bg-gray-50' }`}>
                  <TableCell className="text-center">{(currentPage - 1) * PAGE_SIZE + idx + 1}</TableCell>
                  <TableCell className="font-medium">{v.vendor_name}</TableCell>
                  <TableCell>{v.phone || '-'}</TableCell>
                  <TableCell>{roles[v.role_id] ?? '-'}</TableCell>
                  <TableCell>{v.region || '-'}</TableCell>
                  <TableCell className="text-center flex justify-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => router.push(`/vendor/edit/${v.vendor_id}`)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="rounded-full"
                      onClick={() => handleDelete(v.vendor_id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="mr-8">
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      </Card>
    </div>
  );
}
