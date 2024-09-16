"use client";

import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useState } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formUrlQuery, formatAmount } from "@/lib/utils";

export const CurrencyDropdown = ({
  currencies = [],
  disabled,
  setValue,
  setCurrency,
  type,
  otherStyles,
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selected, setSelected] = useState(currencies[0]);

  const handleCurrencyChange = (value: string) => {
    setSelected(value);
    setCurrency(value);

    if (setValue) {
      setValue(type, value);
    }
  };

  return (
    <Select
      defaultValue="Choose Currency"
      disabled={disabled}
      onValueChange={(value) => handleCurrencyChange(value)}
    >
      <SelectTrigger
        className={`flex bg-white w-full gap-3 md:w-[300px] ${otherStyles}`}
      >
        <Image
          src="icons/credit-card.svg"
          width={20}
          height={20}
          alt="account"
        />
        <SelectValue placeholder="Select a currency" />
      </SelectTrigger>
      <SelectContent
        className={`w-full bg-white md:w-[300px] ${otherStyles}`}
        align="end"
      >
        <SelectGroup>
          <SelectLabel className="py-2 font-normal text-gray-500">
            Choose a currency
          </SelectLabel>
          {currencies.map((currency: string) => (
            <SelectItem
              key={currency}
              value={currency}
              className="cursor-pointer border-t"
            >
              <div className="flex flex-col ">
                <p className="text-16 font-medium">{currency}</p>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};