"use client";

import React, { useEffect, useState } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { CurrencyDropdown } from "./CurrencyDropdown";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import useStore from "@/lib/tbdex";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  fromCurrency: z.string().optional(),
  toCurrency: z.string().optional(),
});

const SendMoneyForm = ({ accounts = [] }) => {
  const router = useRouter();
  const { offerings, filterOfferings, filteredOfferings } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isToCurrencyEnabled, setIsToCurrencyEnabled] = useState(false);
  const [fromCurrency, setFromCurrency] = useState(null);
  const [toCurrency, setToCurrency] = useState(null);

  console.log('filtered', filteredOfferings)

  const [state, setState] = useState({
    offerings: [],
    payinCurrencies: [],
    payoutCurrencies: [],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      toCurrency: "",
      fromCurrency: "",
    },
  });

  useEffect(() => {
    // Initialize offerings and unique currencies after `offerings` is available
    if (offerings.length > 0) {
      setState({
        offerings,
        payinCurrencies: [
          ...new Set(offerings.map((item) => item.data.payin.currencyCode)),
        ],
        payoutCurrencies: [
          ...new Set(offerings.map((item) => item.data.payout.currencyCode)),
        ],
      });
    }
  }, [offerings]); // Re-run when `offerings` changes

  useEffect(() => {
    updateToCurrencies();
  }, [fromCurrency]);

  const updateToCurrencies = () => {
    if (fromCurrency) {
      const relevantOfferings = state.offerings.filter(
        (offering) => offering.data.payin.currencyCode === fromCurrency
      );

      const payoutCurrencies = new Set();
      relevantOfferings.forEach((offering) => {
        payoutCurrencies.add(offering.data.payout.currencyCode);
      });

      setState((prevState) => ({
        ...prevState,
        payoutCurrencies: Array.from(payoutCurrencies),
      }));

      setIsToCurrencyEnabled(true); // Enable if there are relevant offerings
    } else {
      // Reset when no `fromCurrency` is selected
      setState((prevState) => ({
        ...prevState,
        payoutCurrencies: [],
      }));
      setIsToCurrencyEnabled(false);
    }
  };

  const submit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    // @TODO: implement handling of currencies exchange
    console.log('data', data)

    const {fromCurrency, toCurrency} = data;
    if (fromCurrency && toCurrency) {
      filterOfferings(fromCurrency, toCurrency);
    }

    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="flex flex-col">
        <FormField
          control={form.control}
          name="fromCurrency"
          render={() => (
            <FormItem className="border-t border-gray-200">
              <div className="payment-transfer_form-item pb-6 pt-5">
                <div className="payment-transfer_form-content">
                  <FormLabel className="text-14 font-medium text-gray-700">
                    Select From Currency
                  </FormLabel>
                  <FormDescription className="text-12 font-normal text-gray-600">
                    Select the currency of the funds you want to send
                  </FormDescription>
                </div>
                <div className="flex w-full flex-col">
                  <FormControl>
                    <CurrencyDropdown
                      currencies={state.payinCurrencies}
                      disabled={false}
                      setValue={form.setValue}
                      setCurrency={setFromCurrency}
                      type="fromCurrency"
                      otherStyles="w-full"
                    />
                  </FormControl>
                  <FormMessage className="text-12 text-red-500" />
                </div>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="toCurrency"
          render={() => (
            <FormItem className="border-t border-gray-200">
              <div className="payment-transfer_form-item pb-6 pt-5">
                <div className="payment-transfer_form-content">
                  <FormLabel className="text-14 font-medium text-gray-700">
                    Select To Currency
                  </FormLabel>
                  <FormDescription className="text-12 font-normal text-gray-600">
                    Select the currency of the funds to be received
                  </FormDescription>
                </div>
                <div className="flex w-full flex-col">
                  <FormControl>
                    <CurrencyDropdown
                      currencies={state.payoutCurrencies}
                      disabled={!isToCurrencyEnabled}
                      setValue={form.setValue}
                      setCurrency={setToCurrency}
                      type="toCurrency"
                      otherStyles="w-full"
                    />
                  </FormControl>
                  <FormMessage className="text-12 text-red-500" />
                </div>
              </div>
            </FormItem>
          )}
        />

        <div className="payment-transfer_btn-box">
          <Button type="submit" className="payment-transfer_btn">
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> &nbsp; Sending...
              </>
            ) : (
              "Get Offerings"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default SendMoneyForm;
