"use client";

import { useState } from "react";
import { SetterTable } from "./SetterTable";
import { CloserTable } from "./CloserTable";
import type { SetterReport, CloserReport, FilterState } from "@/types/database";

interface DataTablesProps {
  setterReports: SetterReport[];
  closerReports: CloserReport[];
  roleFilter: FilterState["role"];
}

export function DataTables({
  setterReports,
  closerReports,
  roleFilter,
}: DataTablesProps) {
  const [activeTab, setActiveTab] = useState<"setters" | "closers">(
    roleFilter === "Closer" ? "closers" : "setters"
  );

  // If role filter is specific, only show that tab
  const showSetters = roleFilter !== "Closer";
  const showClosers = roleFilter !== "Setter";

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-lg overflow-hidden animate-fade-in">
      {/* Tabs */}
      {roleFilter === "all" && (
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab("setters")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "setters"
                ? "bg-white/[0.05] text-white border-b-2 border-blue-400"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            Setter Reports ({setterReports.length})
          </button>
          <button
            onClick={() => setActiveTab("closers")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "closers"
                ? "bg-white/[0.05] text-white border-b-2 border-green-400"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            Closer Reports ({closerReports.length})
          </button>
        </div>
      )}

      {/* Table Content */}
      <div className="p-4">
        {roleFilter === "all" ? (
          <>
            {activeTab === "setters" && <SetterTable reports={setterReports} />}
            {activeTab === "closers" && <CloserTable reports={closerReports} />}
          </>
        ) : (
          <>
            {showSetters && (
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-3">
                  Setter Reports ({setterReports.length})
                </h3>
                <SetterTable reports={setterReports} />
              </div>
            )}
            {showClosers && (
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-3">
                  Closer Reports ({closerReports.length})
                </h3>
                <CloserTable reports={closerReports} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
