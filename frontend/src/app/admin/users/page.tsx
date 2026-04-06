"use client";

import React, { useState } from "react";
import { Loader2, Search, Trash2, Shield, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    useGetAdminUsersQuery,
    useDeleteAdminUserMutation,
    useSetAdminUserRoleMutation,
    useGetMeQuery
} from "@/store/api";
import { UserRole } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminUsersPage() {
    const [search, setSearch] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);

    const { data: me } = useGetMeQuery();
    const { data, isLoading } = useGetAdminUsersQuery({ search: searchTerm, page });

    const [deleteUser] = useDeleteAdminUserMutation();
    const [setRole] = useSetAdminUserRoleMutation();

    const handleDelete = async (id: string, username: string) => {
        if (!confirm(`WARNING: Deleting user "${username}" will also delete their channel, videos, and comments. Proceed?`)) return;

        try {
            await deleteUser(id).unwrap();
            toast.success("User deleted successfully");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to delete user");
        }
    };

    const handleRoleChange = async (id: string, role: UserRole) => {
        try {
            await setRole({ id, role }).unwrap();
            toast.success("Role updated successfully");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to update role. Only Admins can change roles.");
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchTerm(search);
        setPage(1);
    };

    const isSuperAdmin = me?.role === UserRole.Admin;

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#212121] p-6 rounded-2xl border border-[#3F3F3F] shadow-lg">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        Users Management
                        {!isSuperAdmin && <span className="text-xs bg-[#FF4444]/20 text-[#FF4444] px-2 py-1 rounded-md uppercase tracking-wider">Read Only</span>}
                    </h1>

                    <p className="text-[#AAAAAA] text-sm mt-1">View and manage platform users and their roles.</p>
                </div>

                <form onSubmit={handleSearch} className="flex items-center w-full md:w-auto">
                    <div className="flex items-center bg-[#121212] border border-[#3F3F3F] rounded-lg px-4 h-10 w-full md:w-[300px] focus-within:border-[#3ea6ff] transition-colors">
                        <Search className="w-4 h-4 text-[#AAAAAA] mr-2 shrink-0" />

                        <input
                            type="text"
                            placeholder="Search by username or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent border-none outline-none text-white text-sm w-full"
                        />
                    </div>
                </form>
            </div>

            <div className="bg-[#212121] border border-[#3F3F3F] rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto w-full">
                    {isLoading ? (
                        <div className="p-16 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff]" /></div>
                    ) : data?.users && data.users.length > 0 ? (
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="border-b border-[#3F3F3F] bg-[#181818]/80">
                                    <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider">User</th>
                                    <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider">Role</th>
                                    <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider">Status</th>
                                    <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider">Joined</th>
                                    <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider text-right pr-8">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[#3F3F3F]">

                            {data.users.map((user) => (
                                <tr key={user.id} className="hover:bg-[#272727] transition-colors group">
                                    <td className="p-5 flex items-center gap-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={user.avatarUrl} />

                                            <AvatarFallback className="bg-purple-600 text-white font-medium">
                                                {user.username[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex flex-col">
                                            <span className="text-[15px] text-white font-medium">{user.username}</span>
                                            <span className="text-[#AAAAAA] text-sm">{user.email}</span>
                                        </div>
                                    </td>

                                    <td className="p-5">
                                        {isSuperAdmin && user.id !== me?.id ? (
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, Number(e.target.value))}
                                                className={`border text-sm rounded-md px-2 py-1.5 outline-none cursor-pointer ${
                                                    user.role === UserRole.Admin ? "bg-purple-500/10 border-purple-500/30 text-purple-400" :
                                                        user.role === UserRole.Moderator ? "bg-green-500/10 border-green-500/30 text-green-400" :
                                                            "bg-[#121212] border-[#3F3F3F] text-white"
                                                }`}
                                            >
                                                <option value={UserRole.User} className="bg-[#121212] text-white">User</option>
                                                <option value={UserRole.Moderator} className="bg-[#121212] text-white">Moderator</option>
                                                <option value={UserRole.Admin} className="bg-[#121212] text-white">Admin</option>
                                            </select>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                                                user.role === UserRole.Admin ? "bg-purple-500/10 text-purple-400" :
                                                    user.role === UserRole.Moderator ? "bg-green-500/10 text-green-400" :
                                                        "bg-[#3F3F3F] text-[#AAAAAA]"
                                            }`}>
                                                    {user.role === UserRole.Admin && <Shield className="w-3.5 h-3.5" />}
                                                {UserRole[user.role]}
                                                </span>
                                        )}
                                    </td>

                                    <td className="p-5">
                                        {user.hasChannel ? (
                                            <span className="text-blue-400 text-sm bg-blue-400/10 px-2 py-1 rounded">Has Channel</span>
                                        ) : (
                                            <span className="text-[#AAAAAA] text-sm">Viewer</span>
                                        )}
                                    </td>

                                    <td className="p-5 text-[14px] text-[#888888]">
                                        {format(new Date(user.registrationDate), "MMM d, yyyy")}
                                    </td>

                                    <td className="p-5 pr-8 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isSuperAdmin && user.id !== me?.id && (
                                                <button
                                                    onClick={() => handleDelete(user.id, user.username)}
                                                    className="p-2 hover:bg-red-500/20 text-[#FF4444] rounded-full transition-colors cursor-pointer"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-16 text-center text-[#AAAAAA]">No users found.</div>
                    )}
                </div>

                {data && data.total > data.pageSize && (
                    <div className="p-4 border-t border-[#3F3F3F] flex justify-center gap-2 bg-[#181818]/80">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-4 py-2 bg-[#272727] hover:bg-[#3F3F3F] text-white rounded-md disabled:opacity-50 text-sm cursor-pointer"
                        >
                            Previous
                        </button>

                        <span className="px-4 py-2 text-[#AAAAAA] text-sm flex items-center">Page {page}</span>

                        <button
                            disabled={page * data.pageSize >= data.total}
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 bg-[#272727] hover:bg-[#3F3F3F] text-white rounded-md disabled:opacity-50 text-sm cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}