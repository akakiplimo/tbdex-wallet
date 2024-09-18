"use client"
import useStore from "@/lib/tbdex";
import { useMemo } from "react";

export default function Credentials() {
  const { customerCredentials, renderCredential } = useStore(); // Get state and functions from Zustand

  // Compute parsed credentials
  const parsedCredentials = useMemo(() => {
    return customerCredentials.map((jwt) => renderCredential(jwt));
  }, [customerCredentials, renderCredential]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Credentials</h2>
      {parsedCredentials.length > 0 ? (
        <div>
          {parsedCredentials.map((credential, index) => (
            <div
              key={index}
              className="mb-4 p-4 border rounded-lg lg:w-1/2 w-full"
            >
              <p>
                <strong>{credential.title}</strong>
              </p>
              <p>
                <strong>Name:</strong> {credential.name}
              </p>
              <p>
                <strong>Country Code:</strong> {credential.countryCode}
              </p>
              <p>
                <strong>Date:</strong> {credential.issuanceDate}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p>No credentials found.</p>
      )}
    </div>
  );
}