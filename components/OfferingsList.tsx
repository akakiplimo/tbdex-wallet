import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import HeaderBox from "./HeaderBox";
import useStore from "@/lib/tbdex";
import { Loader2 } from "lucide-react";

const CombinedOfferingsCredentials = ({
  filteredOfferings = [],
  pfiAllowlist,
}) => {
  const router = useRouter();
  const {
    setOffering,
    offering,
    customerCredentials,
    satisfiesOfferingRequirements,
    customerDid,
    addCredential,
    createExchange,
    rfq
  } = useStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [payinAmount, setPayinAmount] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  // Create state for payment details
  const [paymentDetails, setPaymentDetails] = useState({});

  useEffect(() => {
    if (offering && payinAmount) {
      // Calculate payout amount based on the formula
      setPayoutAmount(offering?.data.payoutUnitsPerPayinUnit * payinAmount);
    }
  }, [offering, payinAmount]);

  const needsCredentials = useMemo(() => {
    return !satisfiesOfferingRequirements(offering, customerCredentials);
  }, [offering, customerCredentials, satisfiesOfferingRequirements]);

  const selectOffering = (selectedOffering) => {
    setOffering(selectedOffering);
    if (needsCredentials) {
      setIsDrawerOpen(true);
    } else {
        router.push("/my-wallet")
    }
  };

  const createCredential = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsLoading(true);
    const subjectDid = customerDid.uri;
    const credential = await fetch(
      `https://mock-idv.tbddev.org/kcc?name=${customerName}&country=${countryCode}&did=${subjectDid}`
    ).then((r) => r.text());
    setIsLoading(false);
    addCredential(credential);
    setIsDrawerOpen(false);
    router.push("/send");
  };

  const validateAndSubmit = () => {
    if (!payinAmount || !payoutAmount) {
      alert("Please enter the amount.");
      return;
    }

    for (const key in offering.value.data.payout.methods[0]
      .requiredPaymentDetails.properties) {
      if (!paymentDetails[key]) {
        alert(
          `Please enter ${offering.value.data.payout.methods[0].requiredPaymentDetails.properties[key].title}.`
        );
        return;
      }

      // check if property has pattern
      const offeringDetailsPattern =
        offering.value.data.payout.methods[0].requiredPaymentDetails.properties[
          key
        ].pattern;

      if (
        offeringDetailsPattern &&
        !paymentDetails[key].match(offeringDetailsPattern)
      ) {
        alert(
          `Please enter a valid ${offering.value.data.payout.methods[0].requiredPaymentDetails.properties[key].title}.`
        );
        return;
      }
    }

    submitRequest();
  };

  const submitRequest = async () => {
    console.log("submitting...");
    console.log(offering, payinAmount, paymentDetails)
    try {
      await createExchange(offering, payinAmount, paymentDetails);
    } catch (error) {
      console.log(error);
    }

    router.push("/");
  };

  return (
    <>
      {filteredOfferings?.length > 0 && (
        <>
          <HeaderBox
            title="Exchange Rate Offerings"
            subtext="Here are your offerings"
          />
          {filteredOfferings?.map((offeringItem) => {
            const pfiName = pfiAllowlist.find(
              (pfi) => pfi.pfiUri === offeringItem.metadata.from
            )?.pfiName;
            return (
              <Drawer
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                key={offeringItem?.id}
              >
                <DrawerTrigger asChild>
                  <Link href="#" onClick={() => selectOffering(offeringItem)}>
                    <Card>
                      <CardHeader>
                        <CardTitle>{pfiName}</CardTitle>
                        <CardDescription>
                          {offeringItem?.data.description}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="text-blue-500">
                        {offeringItem?.data.payoutUnitsPerPayinUnit}{" "}
                        {offeringItem?.data.payout.currencyCode} for 1{" "}
                        {offeringItem?.data.payin.currencyCode}
                      </CardFooter>
                    </Card>
                  </Link>
                </DrawerTrigger>
                <DrawerContent className="bg-white">
                  {!customerCredentials.length ? (
                    <div className="mx-auto w-full max-w-sm bg-white">
                      <DrawerHeader>
                        <DrawerTitle>Create Credential</DrawerTitle>
                        <DrawerDescription className="text-red-500">
                          Required credential missing. Create Credential
                        </DrawerDescription>
                      </DrawerHeader>
                      <form onSubmit={createCredential} className="p-4">
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2">
                            Name
                          </label>
                          <input
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            type="text"
                            required
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2">
                            Country Code
                          </label>
                          <input
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            type="text"
                            maxLength={2}
                            required
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <DrawerFooter>
                          <Button
                            type="submit"
                            className="payment-transfer_btn"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 size={20} className="animate-spin" />{" "}
                                &nbsp; Sending...
                              </>
                            ) : (
                              "Create Credentials"
                            )}
                          </Button>
                          <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DrawerClose>
                        </DrawerFooter>
                      </form>
                    </div>
                  ) : (
                    <div className="mx-auto w-full max-w-sm bg-white">
                      <DrawerHeader>
                        <DrawerTitle>Enter Transaction details</DrawerTitle>
                      </DrawerHeader>
                      <form onSubmit={submitRequest} className="p-4">
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2">
                            You Send ({offeringItem?.data.payin.currencyCode})
                          </label>
                          <input
                            value={payinAmount}
                            onChange={(e) => setPayinAmount(e.target.value)}
                            type="number"
                            required
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2">
                            They Get ({offeringItem?.data.payout.currencyCode})
                          </label>
                          <input
                            value={payoutAmount}
                            disabled
                            type="number"
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <DrawerDescription className="text-blue-500">
                          Exchange Rate: &nbsp;
                          {offeringItem?.data.payoutUnitsPerPayinUnit}{" "}
                          {offeringItem?.data.payout.currencyCode} for 1{" "}
                          {offeringItem?.data.payin.currencyCode}
                        </DrawerDescription>

                        <PaymentDetailsInput
                          offering={offeringItem}
                          needsCredentials={needsCredentials}
                          paymentDetails={paymentDetails}
                          setPaymentDetails={setPaymentDetails}
                        />

                        <DrawerDescription className="text-xs text-green-500 mb-2 flex">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="green"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="h-5 w-5"
                          >
                            <path d="M20 6 9 17l-5-5"></path>
                          </svg>
                          Required credentials available.
                        </DrawerDescription>
                        <DrawerFooter>
                          <Button
                            type="submit"
                            className="payment-transfer_btn"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 size={20} className="animate-spin" />{" "}
                                &nbsp; Sending...
                              </>
                            ) : (
                              "Request for Quote"
                            )}
                          </Button>
                          <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DrawerClose>
                        </DrawerFooter>
                      </form>
                    </div>
                  )}
                </DrawerContent>
              </Drawer>
            );
          })}
        </>
      )}
    </>
  );
};

const PaymentDetailsInput = ({
  paymentDetails,
  setPaymentDetails,
  offering,
  needsCredentials,
}) => {
  // Handler for input changes
  const handleChange = (key, value) => {
    setPaymentDetails((prevDetails) => ({
      ...prevDetails,
      [key]: value,
    }));
  };

  return (
    <>
      {offering?.data?.payout?.methods[0]?.requiredPaymentDetails?.properties &&
        Object.keys(
          offering.data.payout.methods[0].requiredPaymentDetails.properties
        ).map((key) => {
          const detail =
            offering.data.payout.methods[0].requiredPaymentDetails.properties[
              key
            ];
          return (
            <div key={key} className="mb-4">
              <label
                htmlFor={key}
                className="block text-gray-700 dark:text-gray-300 mb-2"
              >
                {detail.title}
              </label>
              <input
                id={key}
                type={detail.type}
                pattern={detail.pattern}
                value={paymentDetails[key] || ""}
                onChange={(e) => handleChange(key, e.target.value)}
                required
                className="w-full p-2 border rounded disabled:bg-slate-200"
                disabled={needsCredentials}
              />
              <small className="block text-gray-500 dark:text-gray-400">
                {detail.description}
              </small>
            </div>
          );
        })}
    </>
  );
};

export default CombinedOfferingsCredentials;
