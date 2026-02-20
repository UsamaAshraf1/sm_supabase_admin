import React, { useMemo, useState, useEffect } from "react";
import "../styles/order.css";
import "../styles/modal.css";
import personicon from "../assets/personicon.png";
import foldericon from "../assets/foldericon.png";
import { COLUMNS_ORDER_BOOKING } from "../utils/Col";
import { usePagination, useTable, useSortBy } from "react-table";
import { useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ToastContainer, toast } from "react-toastify";
import backicon from "../assets/back.png";
import { url } from "../utils/urls";
import axios from "axios";

const orderStatusList = [
  "Pending Payment",
  "Processing",
  "Out For Delivery",
  "Completed",
  "Failed",
  "Cancel Request",
];
const actions = orderStatusList.map((e, index) => (
  <option key={index}>{e}</option>
));
const action = (
  <select
    name=""
    id=""
    className="card-btn"
    style={{
      backgroundColor: "rgba(94, 99, 102, 0.08)",
      color: "#8B8D97",
    }}
    disabled
  >
    {actions}
  </select>
);

// Modal Component
const RescheduleModal = ({ isOpen, onClose, data, setVlaue }) => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedSlot, setSelectedSlot] = useState("");
  const [DoctorSlots, setDoctorSlots] = useState([]);

  const getDoctorSlots = async () => {
    try {
      const response = await axios.get(
        `${url}/v1/doctor/get-slot-by-date?docId=${data?.cart?.doctor_id}&date=${selectedDate}`
      );
      setDoctorSlots(response?.data?.slots);
    } catch (error) {
      setDoctorSlots([]);
      console.error("Failed to Status update:", error);
    }
  };

  const getClinicSlots = async () => {
    try {
      const response = await axios.get(
        `${url}/v1/doctor/get-clinic-slot-by-date?date=${selectedDate}`
      );
      setDoctorSlots(response?.data?.slots);
    } catch (error) {
      setDoctorSlots([]);
      console.error("Failed to Status update:", error);
    }
  };

  useEffect(() => {
    if (data?.cart?.doctor_id === null) {
      getClinicSlots();
    } else {
      getDoctorSlots();
    }
  }, [selectedDate]);

  console.log(DoctorSlots);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error("Please select a time slot");
      return;
    }
    try {
      const response = await axios.post(`${url}/v1/order/reschedule-slot`, {
        order_id: data?.order_id,
        delete_slot_id: data?.cart?.slotReservations[0]?.slot_reservation_id,
        doctor_id: data?.cart?.doctor_id,
        slotTiming: selectedSlot,
        slotDate: selectedDate,
        slotDay: DoctorSlots?.day,
      });
      toast.success("Reshedule Done");
      setVlaue("Reschedule");
      onClose();
    } catch (error) {
      console.error("Failed to reschedule:", error);
      toast.error("Failed to reschedule");
    }
  };

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error("Please select a time slot");
      return;
    }
    try {
      const response = await axios.post(
        `${url}/v1/order/reschedule-slot-by-clinic`,
        {
          order_id: data?.order_id,
          delete_slot_id:
            data?.cart?.ServiceReservations[0]?.service_reservation_id,
          slotTiming: selectedSlot,
          slotDate: selectedDate,
          slotDay: DoctorSlots?.day,
        }
      );
      toast.success("Reshedule Done");
      setVlaue("Reschedule");
      onClose();
    } catch (error) {
      console.error("Failed to reschedule:", error);
      toast.error("Failed to reschedule");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`modal-backdrop ${isOpen ? "modal-backdrop--open" : ""}`}
      onClick={onClose}
    >
      <div
        className={`modal-panel ${isOpen ? "modal-panel--open" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content-new">
          <div className="modal-header">
            <h2 className="modal-title">Reschedule Appointment</h2>
            <button onClick={onClose} className="modal-close">
              <svg
                className="modal-close-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="modal-body">
            <form
              onSubmit={
                data?.cart?.doctor_id === null
                  ? handlePackageSubmit
                  : handleSubmit
              }
            >
              <div className="modal-field">
                <label className="chead">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="ctext w-full border border-gray-300 rounded-md p-2 mt-1"
                  required
                />
              </div>

              <div className="modal-field" style={{ marginTop: "20px" }}>
                <label className="chead">Available Slots</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {DoctorSlots?.slots?.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`slot-button ctext ${
                        selectedSlot === slot[0] ? "slot-button--selected" : ""
                      }`}
                      onClick={() => setSelectedSlot(slot[0])}
                    >
                      {slot[0]}
                    </button>
                  ))}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "end",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: "10px 20px",
                    background: "gray",
                    borderRadius: "10px",
                    border: "none",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    background: "#3498db",
                    borderRadius: "10px",
                    border: "none",
                  }}
                >
                  Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Order() {
  const navigate = useNavigate();
  const location = useLocation();
  const [presviosData, setPreviousData] = useState(
    location.state ? location.state?.data : ""
  );

  console.log(presviosData);
  const [prodClass, setProdClass] = useState(false);
  const [bookClass, setBookClass] = useState(true);
  const [boardClass, setBoardClass] = useState(false);
  const [vidClass, setVidClass] = useState(false);
  const [adopClass, setAdopClass] = useState(false);
  const [orderData, setOrderData] = useState(presviosData);
  const [orderStatus, setOrderStatus] = useState(presviosData?.order_status);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // orderData?.map((item) => {
  //   item.total_single = item.price * item.quantity - item.discount_price;
  //   item.action = action;
  // });

  console.log(orderData?.request_payload);

  // const data = useMemo(() => orderData, [orderData]);
  // const [columns, setColumns] = useState(COLUMNS_ORDER_BOOKING);
  // const tableinstance = useTable({ columns, data }, useSortBy, usePagination);
  const data = useMemo(() => [orderData], [orderData]);
  const [columns, setColumns] = useState(COLUMNS_ORDER_BOOKING);
  const tableinstance = useTable({ columns, data }, useSortBy, usePagination);
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    nextPage,
    previousPage,
    gotoPage,
    pageOptions,
    state,
    pageCount,
    setPageSize,
    prepareRow,
  } = tableinstance;

  const updateOrderStatus = async () => {
    try {
      const response = await axios.post(`${url}/v1/order/update`, {
        order_id: presviosData?.order_id,
        status: orderStatus,
      });
      toast.success("Status updated");
    } catch (error) {
      console.error("Failed to Status update:", error);
      toast.error("Failed to Status update");
    }
  };

  useEffect(() => {
    if (
      orderStatus !== presviosData?.order_status &&
      orderStatus !== "Reschedule"
    ) {
      updateOrderStatus();
    }
  }, [orderStatus]);

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setOrderStatus(newStatus);
    if (newStatus === "Reschedule") {
      setIsModalOpen(true);
    }
  };

  const slotTimeString = orderData[0]?.slotTiming;
  const currentTime = new Date();
  let slotTime = null;
  if (slotTimeString) {
    const [hours, minutes, seconds] = slotTimeString.split(":").map(Number);
    slotTime = new Date(currentTime);
    slotTime.setHours(hours, minutes, seconds, 0);
  }

  console.log(presviosData);
  return (
    <div>
      <div className="order-content">
        <div className="order-header">
          <div className="header-div">
            <div className="back">
              <button className="back-btn" onClick={() => navigate(-1)}>
                <img src={backicon} alt="back" className="back-icon" />
              </button>
            </div>
            <div className="oheader">
              <span className="order-heading">Appointment Number</span>
              <span className="head-value">{presviosData?.visitId}</span>
            </div>
            <div className="oheader">
              <span className="order-heading">Order Date</span>
              <span className="head-value">
                {format(new Date(presviosData?.created), "dd MMM yyyy h:mm a")}
              </span>
            </div>
          </div>
          {/* <div className="header-div">
            <div
              name=""
              id=""
              className="mark"
              style={{
                backgroundColor: "black",
                color: "white",
                paddingBottom: "10px",
              }}
            >
              <select
                value={orderStatus}
                onChange={handleStatusChange}
                style={{
                  backgroundColor: "black",
                  color: "white",
                  padding: "5px",
                  border: "none",
                  outline: "none",
                }}
                disabled={
                  orderStatus === "Completed" || orderStatus === "Cancelled"
                }
              >
                <option value="pending">Pending</option>
                {presviosData?.cart?.location === "At Home" && (
                  <>
                    <option value="Doctor Enroute">Doctor Enroute</option>
                    <option value="Doctor Arrived">Doctor Arrived</option>
                    <option value="Visit Started">Visit Started</option>
                  </>
                )}
                <option value="Reschedule">Reschedule</option>
                <option value="Completed">Completed</option>
                {slotTime && currentTime < slotTime && (
                  <option value="Cancelled">Cancelled</option>
                )}
                <option value="No Show">No Show</option>
              </select>
            </div>
          </div> */}
        </div>
        <div className="order-body">
          <div className="cards">
            <div className="card">
              <div className="ctop">
                <div className="card-iconholder">
                  <img
                    src={personicon}
                    alt="personicon"
                    className="card-icon"
                  />
                </div>
                <div className="ccustomer">
                  <div>
                    <span className="chead">
                      {presviosData?.customer?.first_name
                        ? presviosData.customer.first_name
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
              <div className="cbottem">
                <div className="btm-part">
                  <span className="chead">Phone</span>
                  <span className="ctext">
                    {presviosData?.customer?.phone
                      ? presviosData.customer.phone
                      : ""}
                  </span>
                </div>
                <div className="btm-part">
                  <span className="chead">Email</span>
                  <span className="ctext">
                    {presviosData?.customer?.email
                      ? presviosData.customer.email
                      : ""}
                  </span>
                </div>
                {/* {presviosData?.cart?.location === "At Home" && (
                  <div className="btm-part">
                    <span className="chead">Address</span>
                    <span className="ctext">
                      {presviosData?.patient_info?.address
                        ? presviosData?.patient_info?.address
                        : "No Address Found"}
                    </span>
                  </div>
                )} */}
              </div>

              <div className="cbottem">
                <div className="btm-part">
                  <span className="chead">Order Type</span>
                  <span className="ctext">
                    {presviosData?.orderType ? presviosData.orderType : ""}
                  </span>
                </div>
                {presviosData.orderType === "Package" && (
                  <div className="btm-part">
                    <span className="chead">Package Name</span>
                    <span className="ctext">
                      {presviosData?.request_payload?.PackageName
                        ? presviosData?.request_payload?.PackageName
                        : ""}
                    </span>
                  </div>
                )}

                {presviosData?.otherDetails?.VideoLink && (
                  <div className="btm-part">
                    <span className="chead">Video Link</span>
                    <a
                      href={`${presviosData.otherDetails?.VideoLink}`}
                      target="_blank"
                      className="ctext" rel="noreferrer"
                    >
                      {presviosData.otherDetails?.VideoLink ? presviosData.otherDetails?.VideoLink : ""}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="order-table-div">
            <div className="tab-header">
              <span
                className={
                  bookClass ? "table-heading table-heading-bg" : "table-heading"
                }
                onClick={() => {
                  setOrderData(presviosData?.cart?.slotReservations);
                  setColumns(COLUMNS_ORDER_BOOKING);
                  setProdClass(false);
                  setBoardClass(false);
                  setVidClass(false);
                  setAdopClass(false);
                  setBookClass(true);
                }}
                style={{ cursor: "pointer" }}
              >
                Booking Items{" "}
                <span style={{ fontWeight: 600 }}>
                  {presviosData?.cart?.slotReservations?.length > 0
                    ? presviosData?.cart?.slotReservations.length
                    : presviosData?.cart?.ServiceReservations.length}
                </span>
              </span>
            </div>
            <table {...getTableProps()} className="order-table">
              <thead>
                {headerGroups.map((headerGroup) => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column) => (
                      <th
                        {...column.getHeaderProps(
                          column.getSortByToggleProps()
                        )}
                        className="order-table-head order-table-row ctext"
                      >
                        {column.render("Header")}
                        {column.isSorted ? (column.isSortedDesc ? "" : "") : ""}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody {...getTableBodyProps()}>
                {page.map((row) => {
                  prepareRow(row);
                  return (
                    <tr
                      {...row.getRowProps()}
                      className="tr"
                      style={{ cursor: "pointer" }}
                    >
                      {row.cells.map((cell) => {
                        return (
                          <td
                            {...cell.getCellProps()}
                            className="order-table-row chead"
                          >
                            {cell.render("Cell")}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* <div className="content-footer">
            <div className="footer-left">
              <div className="footer-card">
                <div className="footer-ctop">
                  <div className="card-iconholder">
                    <img
                      src={foldericon}
                      alt="personicon"
                      className="card-icon"
                    />
                  </div>
                  <div className="c-btns"></div>
                </div>
                <div className="cbottem">
                  <div className="btm-part">
                    <span className="chead">Payment Method</span>
                    <span className="ctext">
                      {presviosData?.payment?.option}
                    </span>
                  </div>
                  <div className="btm-part">
                    <span className="chead">Refund</span>
                    <span className="ctext">
                      AED {presviosData?.refund_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="btm-part">
                    <span className="chead">Deduct Amount</span>
                    <span className="ctext">
                      AED {presviosData?.total_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="footer-card">
                <div className="order-trail">
                  <span className="chead">Order Trail</span>
                  {presviosData?.order_trails
                    ?.sort(
                      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                    )
                    .map((item, index) => (
                      <span className="ctext" key={index}>
                        {format(new Date(item.createdAt), "h:mm a ")}
                        {item.status}
                      </span>
                    ))}
                </div>
              </div>
            </div>
            <div className="footer-right">
              <div className="total-card">
                <div className="order-total">
                  <span className="total-row">
                    <span className="chead">Item Sub Total:</span>
                    <span className="ctext">
                      AED{" "}
                      {(
                        presviosData?.sub_price +
                          presviosData?.redeemablePoint || 0
                      ).toFixed(2)}
                    </span>
                  </span>
                  <span className="total-row">
                    <span className="chead">VAT:</span>
                    <span className="ctext">
                      AED {presviosData?.vat_price.toFixed(2)}
                    </span>
                  </span>
                  {presviosData?.redeemablePoint ? (
                    <span className="total-row">
                      <span className="chead">Redeem Points:</span>
                      <span className="ctext">
                        {presviosData?.redeemablePoint.toFixed(2)}
                      </span>
                    </span>
                  ) : (
                    ""
                  )}
                  <span className="total-row">
                    <span className="chead">Order Total:</span>
                    <span className="ctext">
                      AED {presviosData?.total_price.toFixed(2)}
                    </span>
                  </span>
                </div>
                <div className="order-total">
                  <span className="total-row">
                    <span className="chead">Paid:</span>
                    <span className="ctext">
                      AED {presviosData?.total_price.toFixed(2)}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </div>
      <RescheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={presviosData}
        setVlaue={setOrderStatus}
      />
      <ToastContainer />
    </div>
  );
}
