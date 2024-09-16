"use client";

import React from "react";
import BankCard from "@/components/BankCard";
import HeaderBox from "@/components/HeaderBox";
import SendMoneyForm from "@/components/SendMoneyForm";
import { getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import useStore from "@/lib/tbdex";
import OfferingsList from "@/components/OfferingsList";

const MyWallet = () => {
  const { filteredOfferings, pfiAllowlist } = useStore();

  return (
    <section className="flex flex-col lg:flex-row min-h-screen w-full">
      <div className="my-banks w-full lg:w-1/2">
        <HeaderBox
          title="My Mobile Wallet"
          subtext="Effortlessly manage your banking activities."
        />

        <div className="space-y-4">
          <h2 className="header-2">Send Money</h2>
          <div className="flex flex-wrap gap-6">
            <SendMoneyForm />
          </div>
        </div>
      </div>
      {filteredOfferings.length && (
        <div className="my-banks w-full lg:w-1/2">
          <OfferingsList filteredOfferings={filteredOfferings} pfiAllowlist={pfiAllowlist} />
        </div>
      )}
    </section>
  );
};

export default MyWallet;
