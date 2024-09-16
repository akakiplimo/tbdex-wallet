import React, { useMemo, useState } from "react";
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
  } = useStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [countryCode, setCountryCode] = useState("");

  const needsCredentials = useMemo(() => {
    return !satisfiesOfferingRequirements(offering, customerCredentials);
  }, [offering, customerCredentials, satisfiesOfferingRequirements]);

  const selectOffering = (selectedOffering) => {
    setOffering(selectedOffering);
    if (needsCredentials) {
      setIsDrawerOpen(true);
    } else {
      router.push("/next-page"); // Replace with your desired route
    }
  };

  const createCredential = async (e: { preventDefault: () => void; }) => {
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
                        <Button type="submit" className="payment-transfer_btn">
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
                </DrawerContent>
              </Drawer>
            );
          })}
        </>
      )}
    </>
  );
};

export default CombinedOfferingsCredentials;
