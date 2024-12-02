import { useEffect, useMemo, useState } from "react";
import PageScaffold from "../../components/PageScaffold";
import GaraazOrderComponent from "./components/GaraazOrderComponent";
import {
  Box,
  Flex,
  IconButton,
  Spinner,
  VStack,
  useDisclosure,
  Text,
  HStack,
  Center,
  Link,
} from "@chakra-ui/react";
import { TextLabels } from "./enums";
import { useGetOrderMediaConfig } from "../PlaceOrderTest/queryHooks";
import {
  useGetAllGaraazOrders,
  useGetOrderHandlers,
  useGetOrderStatsByOrderHandler,
  useGetUniqueCustomersToday,
  useGetUniqueCustomersYesterdayAndThisMonth,
} from "./queryHooks";
import SideFilterTab from "./components/SideFilterTab";

import { BsFillGearFill } from "react-icons/bs";
import TuneIcon from "@mui/icons-material/Tune";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import SideSettingsTab from "./components/SideSettingsTab";
import useOrdersStore from "./store/useOrdersStore";
import useFiltersStore from "./store/useFiltersStore";
import PerformanceCards from "./components/PerformanceCards";
import { Navigation, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

import "swiper/css/navigation";
import "./index.css";
import { NavLink, useLocation } from "react-router-dom";
import { dateTodayApiFormat } from "../../utils/dateResolvers";
import useMatricsStore from "./store/useMetricsStore";
import paths from "../../utils/paths";

export interface OrderHandler {
  _id: string;
  firstName: string;
  lastName: string;
}

export type OrderHandlers = OrderHandler[];

const Index = () => {
  const { pathname } = useLocation();
  const filterObject = useFiltersStore((state) => state.filterObject);
  const queryOffset = useOrdersStore((state) => state.queryOffset);
  const setQueryOffset = useOrdersStore((state) => state.setQueryOffset);

  let filterString = `${
    filterObject.filterOrderNoCheckBoxValue === true
      ? `&orderNo=${filterObject.filterOrderNo}&limit=${filterObject?.limit}&offset=${queryOffset}`
      : `&limit=${
          filterObject?.limit
        }&offset=${queryOffset}&customerEngagementMode=${
          filterObject?.customerType === "customerSearch"
            ? ""
            : filterObject.customerType
        }${filterObject?.orderStatus}${
          filterObject.supplierOrderStatus
        }&orderHandlerId=${filterObject?.orderHandler}&startDate=${
          filterObject.startDate ?? dateTodayApiFormat
        }&endDate=${filterObject.endDate ?? dateTodayApiFormat}&customerId=${
          filterObject?.customerId
        }${filterObject.orderType}${filterObject.transactionType}`
  }`;

  const {
    isLoading: loadingOrders,
    isFetched,
    refetch,
  } = useGetAllGaraazOrders(filterString);
  let today = useGetUniqueCustomersToday("?range=today");
   
  const { data } = useMatricsStore((state:any) => ({ data: state.data }));

  const yesterdayAndMonth = useGetUniqueCustomersYesterdayAndThisMonth("?range=yesterday&range=month")
  const allorders = useOrdersStore((state) => state.allOrders);

  const scrollOrderId = useOrdersStore((state) => state.scrollOrderId);
  const { data: orderCancellationReason, isLoading: loadingOrderCancellation } =
    useGetOrderMediaConfig();

  const { isLoading: loadingOrderHandlers } = useGetOrderHandlers();
  const { data: orderStats, isLoading: loadingOrderStats } =
    useGetOrderStatsByOrderHandler();
  const orderHandlers = useOrdersStore((state) => state.orderHandlers);

  const {
    isOpen: isSideFilterTabOpen,
    onOpen: onSideFilterTabOpen,
    onClose: onSideFilterTabClose,
  } = useDisclosure();
  const {
    isOpen: isSideSettingsTabOpen,
    onOpen: onSideSettingsTabOpen,
    onClose: onSideSettingsTabClose,
  } = useDisclosure();

  const [orderStartIndex, setOrderStartIndex] = useState(queryOffset + 1);
  const [orderEndIndex, setOrderEndIndex] = useState(
    queryOffset + filterObject.limit > allorders.count
      ? allorders.count
      : queryOffset + filterObject.limit
  );
  const [isFiltersChanged, setIsFiltersChanged] = useState(false);
  const topThreeCounts = useMemo(() => {
    const uniqueCounts = Array.from(
      new Set(orderStats?.map((stat: any) => stat.orders_handled_today))
    );
    const topThree = uniqueCounts.slice(0, 3);
    return topThree;
  }, [orderStats]);

  useEffect(() => {
    setOrderEndIndex(
      queryOffset + filterObject.limit > allorders.count
        ? allorders.count
        : queryOffset + filterObject.limit
    );
  }, [allorders.count]);

  useEffect(() => {
    if (isFiltersChanged || queryOffset === 0) {
      setOrderEndIndex(
        allorders?.count >= filterObject.limit
          ? filterObject.limit
          : allorders?.count
      );
    }
  }, [allorders, isFetched]);

  useEffect(() => {
    refetch();
  }, [queryOffset]);

  useEffect(() => {
    refetch();
  }, [filterString, filterObject]);

  useEffect(() => {
    if (scrollOrderId && pathname === "/") {
      const orderElement = document.getElementById(`${scrollOrderId}`);
      if (orderElement) {
        orderElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [pathname]);

  function refetchAllOrders() {
    refetch();
  }

  async function handleNextOrders() {
    setIsFiltersChanged(false);
    setQueryOffset(orderEndIndex);
    setOrderStartIndex(orderStartIndex + filterObject.limit);
    setOrderEndIndex(
      orderEndIndex + filterObject.limit <= allorders?.count
        ? orderEndIndex + filterObject.limit
        : allorders?.count
    );
  }

  async function handlePreviousOrders() {
    setIsFiltersChanged(false);
    const newOffset = orderStartIndex - filterObject.limit - 1;
    setQueryOffset(newOffset);
    setOrderEndIndex(orderStartIndex - 1);
    setOrderStartIndex(orderStartIndex - filterObject.limit);
  }

  if (loadingOrders || loadingOrderCancellation || loadingOrderHandlers) {
    return (
      <Flex justifyContent="center" alignItems="center" minH="100vh">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return (
    <PageScaffold
      title={TextLabels.ORDERS}
      isHeaderVisible={true}
      headerElements={
        <Box
          display={"flex"}
          marginTop={"auto"}
          marginBottom={"auto "}
          height={"inherit"}
          zIndex={3}
          alignItems={"center"}
        >
          <IconButton
            onClick={onSideFilterTabOpen}
            icon={<TuneIcon />}
            aria-label=""
            bg={"none"}
            color={"black"}
            _hover={{ bgColor: "rgb(225,228,231)" }}
            _focus={{ bgColor: "white", boxShadow: "none" }}
          />

          <Box
            width={"0.5px"}
            backgroundColor={"lightgrey"}
            mr={2}
            ml={2}
            padding={"2px 0px"}
            boxSizing="border-box"
            height={"70%"}
          ></Box>

          <IconButton
            onClick={onSideSettingsTabOpen}
            icon={<BsFillGearFill />}
            aria-label=""
            fontSize={"lg"}
            bg={"none"}
            color={"black"}
            mr={2}
            _hover={{ bgColor: "rgb(225,228,231)" }}
            _focus={{ bgColor: "none", boxShadow: "none" }}
          />

          <Box display={"flex"} alignItems={"center"}>
            <Text
              textAlign={"center"}
              color={"black"}
              fontSize={"small"}
              mr={5}
            >
              Orders {allorders?.count ? orderStartIndex : 0} -{" "}
              {allorders?.count ? orderEndIndex : 0} of{" "}
              {allorders?.count ? allorders?.count : 0}
            </Text>
            <IconButton
              aria-label=""
              icon={<ChevronLeft />}
              onClick={handlePreviousOrders}
              isDisabled={!(orderStartIndex > 1)}
              mr={1}
              bg={"none"}
              color={"black"}
              _hover={{ bgColor: "rgb(225,228,231)" }}
              _disabled={{
                color: "lightgrey",
                bg: "none",
                _hover: { bg: "none", boxShadow: "none" },
              }}
              _focus={{
                bgColor: "none",
                background: "none",
                boxShadow: "none",
              }}
            ></IconButton>
            <IconButton
              aria-label=""
              icon={<ChevronRight />}
              onClick={handleNextOrders}
              isDisabled={!(orderEndIndex < allorders?.count)}
              bg={"none"}
              color={"black"}
              _hover={{ bgColor: "rgb(225,228,231)" }}
              _disabled={{
                color: "lightgrey",
                bg: "none",
                _hover: { bg: "none", boxShadow: "none" },
              }}
              _focus={{
                bgColor: "none",
                background: "none",
                boxShadow: "none",
              }}
            ></IconButton>
          </Box>
        </Box>
      }
    >
      <Box bg={"white"}>
      <HStack  w={"100%"} h={"120px"} borderRadius={"3px"} alignItems={"center"} bg={"rgb(247, 247, 249)"} p={"5px"} boxShadow={"rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px"} >
      <HStack h={"100px"} w={"84%"} m={"auto"} alignItems={"center"} p={"5px"} >
        <Link as={NavLink} to={paths.customers} _hover={{color: "black"}} target="_blank" rel="noopener noreferrer" >
        <Box w={"250px"} h ={"95%"}   boxShadow="rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px" borderRadius={"4px"} p={"5px"} transition="transform 200ms ease-out" _hover={{ transform: "scale(1.02)" }}>
          <HStack color={"black"}>
            <Center w={"50%"} h={"100%"} fontSize={"11px"} fontWeight={"bold"} color={"#6CA7FC"} >Today</Center>
            <Center w={"50%"} h={"100%"} fontSize={"11px"} fontWeight={"bold"} color={"#6CA7FC"} >Yesterday</Center>
            <Center w={"50%"} h={"100%"} fontSize={"11px"} fontWeight={"bold"} color={"#6CA7FC"} >Month</Center>
          </HStack>
          <HStack>
            <Center w={"50%"} h={"100%"} fontSize={"25px"} fontWeight={"bold"}>{data?.today}</Center>
            <Center w={"50%"} h={"100%"} fontSize={"25px"} fontWeight={"bold"}>{data?.uniqueCustomersYesterday}</Center>
            <Center w={"50%"} h={"100%"} fontSize={"25px"} fontWeight={"bold"}>{data?.uniqueCustomersThisMonth}</Center>
          </HStack>
          <Text textAlign={"center"} mt={"0px"} fontSize={"12px"} >Unique Customers</Text>
        </Box>
      </Link>
      </HStack> 
      </HStack>
      <Box  mt={"10px"} boxShadow={"rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;"} bg={"rgb(247, 247, 249)"}>
      <Swiper
        modules={[Navigation, Autoplay]}
        navigation={true}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        slidesPerView={Math.floor(window.innerWidth / 250)}
        spaceBetween={10}
      >
        {orderStats?.map((orderHandler: any, index: any) => {
          return (
            <SwiperSlide key={index}>
              <PerformanceCards
                userData={orderHandler}
                index={
                  orderHandler.orders_handled_today === topThreeCounts[0]
                    ? 0
                    : orderHandler.orders_handled_today === topThreeCounts[1]
                    ? 1
                    : orderHandler.orders_handled_today === topThreeCounts[2]
                    ? 2
                    : -1
                }
              ></PerformanceCards>
            </SwiperSlide>
          );
        })}
      </Swiper>
      </Box>   

      </Box>  
      <VStack height={"100%"}>
        {allorders?.orders?.map((order: any, index: number) => (
          <GaraazOrderComponent
            refetchAllOrders={refetchAllOrders}
            key={order.orderNo}
            orderData={order}
            orderHandlers={orderHandlers}
            orderCancellationReason={JSON.parse(
              orderCancellationReason?.order_cancellation_reasons
            )}
          />
        ))}

        {(allorders?.orders?.length === 0 ||
          !allorders?.orders ||
          !allorders) && (
          <Box mt={40}>
            <Text>No orders For selected Filters</Text>
          </Box>
        )}
      </VStack>

      <SideFilterTab
        isOpen={isSideFilterTabOpen}
        onClose={onSideFilterTabClose}
        setOrderStartIndex={setOrderStartIndex}
        setIsFiltersChanged={setIsFiltersChanged}
        refetchAllOrders={refetchAllOrders}
      />

      <SideSettingsTab
        isOpen={isSideSettingsTabOpen}
        onClose={onSideSettingsTabClose}
        setIsFiltersChanged={setIsFiltersChanged}
        setOrderStartIndex={setOrderStartIndex}
        refetchAllOrders={refetchAllOrders}
      />
    </PageScaffold>
  );
};

export default Index;
